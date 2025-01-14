/// <reference types="@cloudflare/workers-types" />
import { DurableObjectState } from '@cloudflare/workers-types';
import type { Env } from './worker';
import { BeatMap, PlayerState, GameState } from './types';

interface PlayerScore {
  username: string;
  score: number;
  lastUpdated: number;
}

export class GameSession {
  private host: WebSocket | null = null;
  private scores: Map<string, PlayerScore> = new Map();
  private usedUsernames: Set<string> = new Set();
  private state: DurableObjectState;
  
  constructor(state: DurableObjectState, private env: any) {
    this.state = state;
    // Load existing scores when DO is created
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('scores');
      console.log('Loading stored scores:', stored);
      if (stored) {
        this.scores = new Map(Array.isArray(stored) ? stored : []);
      }
      console.log('Initialized scores:', Array.from(this.scores.entries()));
    });

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('usernames') || [];
      this.usedUsernames = new Set(Array.isArray(stored) ? stored : []);
    });
  }

  private async updateScore(playerId: string, points: number, username: string) {
    await this.state.blockConcurrencyWhile(async () => {
      // Get latest scores from storage
      const stored = await this.state.storage.get('scores') || {};
      this.scores = new Map(Object.entries(stored));

      // Update score
      this.scores.set(playerId, {
        score: points,
        lastUpdated: Date.now(),
        username: username
      });

      // Save back to storage
      await this.state.storage.put('scores', Object.fromEntries(this.scores));
      console.log('Saved scores:', Object.fromEntries(this.scores));
    });
  }

  private async getLeaderboard() {
    return Array.from(this.scores.entries())
      .map(([id, data]) => ({
        playerId: id,
        username: data.username,
        score: data.score,
        lastUpdated: data.lastUpdated
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    console.log('GameSession handling:', url.pathname);

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      server.accept();
      console.log('WebSocket accepted');

      server.addEventListener("message", async (msg) => {
        try {
          const data = JSON.parse(msg.data as string);
          console.log('GameSession received:', data);
          
          if (data.type === 'move' && this.host) {
            console.log('Relaying move to host:', data);
            this.host.send(JSON.stringify({
              type: 'move',
              playerId: data.playerId,
              x: data.x,
              y: data.y
            }));
          } else if (data.type === 'host') {
            console.log('Host connected');
            this.host = server;
          }
        } catch (err) {
          console.error('Error handling message:', err);
        }
      });

      server.addEventListener("close", () => {
        console.log('WebSocket closed');
        if (server === this.host) {
          console.log('Host disconnected');
          this.host = null;
        }
      });

      server.addEventListener("error", (err) => {
        console.error('WebSocket error:', err);
      });

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    if (url.pathname === '/leaderboard') {
      if (request.method === 'POST') {
        const { playerId, username, score } = await request.json() as { 
          playerId: string;
          username: string;
          score: number;
        };
        
        console.log('Received score to save:', { playerId, username, score });
        
        // Update scores in memory and storage
        await this.state.blockConcurrencyWhile(async () => {
          // Get latest scores from storage first
          const stored = await this.state.storage.get('scores') || [];
          this.scores = new Map(Array.isArray(stored) ? stored : []);
          
          // Update score
          this.scores.set(playerId, {
            username,
            score,
            lastUpdated: Date.now()
          });
          
          // Save back to storage
          const scoresArray = Array.from(this.scores.entries());
          console.log('Saving scores to storage:', scoresArray);
          await this.state.storage.put('scores', scoresArray);
        });
        
        console.log('Current scores after save:', Array.from(this.scores.entries()));
        return new Response('Score saved');
      } else {
        // Return top 10 scores for GET requests
        const sortedScores = Array.from(this.scores.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        
        console.log('Returning leaderboard scores:', sortedScores);
        return new Response(JSON.stringify(sortedScores), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/usernames') {
      if (request.method === 'GET') {
        return new Response(JSON.stringify({ 
          usedNames: Array.from(this.usedUsernames) 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (request.method === 'POST') {
        const { username } = await request.json() as { username: string };
        this.usedUsernames.add(username);
        await this.state.storage.put('usernames', Array.from(this.usedUsernames));
        return new Response('OK');
      }
    }

    return new Response("Expected Upgrade: websocket", { status: 426 });
  }
} 