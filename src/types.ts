export interface BeatMap {
  songId: string;
  bpm: number;
  beats: Beat[];
}

export interface Beat {
  time: number;
  type: 'swipe' | 'tap' | 'hold';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
}

export interface PlayerState {
  id: string;
  score: number;
  combo: number;
  isActive: boolean;
  connected: boolean;
}

export interface GameState {
  players: Map<string, PlayerState>;
  currentSong: BeatMap | null;
  startTime: number | null;
  isActive: boolean;
} 