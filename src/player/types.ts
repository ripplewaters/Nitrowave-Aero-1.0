export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

export type PlayerSnapshot = {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  title: string;
  error: string;
};
