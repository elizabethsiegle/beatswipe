/// <reference types="@cloudflare/workers-types" />
import { DurableObjectState } from '@cloudflare/workers-types';

interface PlayerScore {
  username: string;
  score: number;
  lastUpdated: number;
}

export class GameSession {
  private hosts: Set<WebSocket> = new Set(); // Multiple hosts can view the game
  private playerConnections: Map<string, {
    socket: WebSocket,
    color: string,
    username: string
  }> = new Map();
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

  private getRandomColor(): string {
    const colors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
      '#FF00FF', '#00FFFF', '#FFA500', '#800080'
    ];
    const usedColors = new Set(
      Array.from(this.playerConnections.values()).map(p => p.color)
    );
    const availableColors = colors.filter(c => !usedColors.has(c));
    return availableColors.length > 0 
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : colors[Math.floor(Math.random() * colors.length)];
  }

  private broadcastToHosts(message: any) {
    const messageStr = JSON.stringify(message);
    for (const host of this.hosts) {
      host.send(messageStr);
    }
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
          
          if (data.type === 'move') {
            const playerInfo = this.playerConnections.get(data.playerId);
            if (playerInfo && this.hosts.size > 0) {
              this.broadcastToHosts({
                type: 'move',
                playerId: data.playerId,
                username: playerInfo.username,
                color: playerInfo.color,
                x: data.x,
                y: data.y
              });
            }
          } else if (data.type === 'host') {
            console.log('Host connected');
            this.hosts.add(server);
          } else if (data.type === 'join') {
            const color = this.getRandomColor();
            this.playerConnections.set(data.playerId, {
              socket: server,
              color,
              username: data.username
            });
            
            // Notify hosts about new player
            this.broadcastToHosts({
              type: 'playerJoined',
              playerId: data.playerId,
              username: data.username,
              color: color
            });
          }
        } catch (err) {
          console.error('Error handling message:', err);
        }
      });

      server.addEventListener("close", () => {
        console.log('WebSocket closed');
        // Remove from hosts if it was a host
        if (this.hosts.has(server)) {
          this.hosts.delete(server);
        }
        // Remove from players if it was a player
        for (const [playerId, info] of this.playerConnections.entries()) {
          if (info.socket === server) {
            this.playerConnections.delete(playerId);
            // Notify hosts about player leaving
            this.broadcastToHosts({
              type: 'playerLeft',
              playerId: playerId,
              username: info.username
            });
            break;
          }
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