import { invoke, isTauri } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SystemMedia = {
  title: string;
  artist: string;
  app: string;
  playing: boolean;
  position: number;
  duration: number;
};

export type MediaAction = 'toggle' | 'next' | 'previous' | 'restart';

// Polls Windows' "now playing" session (Spotify, a browser tab, ...) while enabled.
// Position is interpolated between polls because most apps only publish it every few seconds.
export function useSystemMedia(enabled: boolean, supported = true) {
  const [media, setMedia] = useState<SystemMedia | null>(null);
  const [now, setNow] = useState(() => performance.now());
  const receivedAt = useRef(performance.now());
  const available = isTauri() && supported;

  const poll = useCallback(async () => {
    try {
      const next = await invoke<SystemMedia | null>('media_session');
      receivedAt.current = performance.now();
      setMedia(next && (next.title || next.artist) ? next : null);
    } catch {
      setMedia(null);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !available) { setMedia(null); return; }
    let pending = false;
    const tick = async () => { if (pending) return; pending = true; await poll(); pending = false; };
    void tick();
    const timer = window.setInterval(() => { void tick(); }, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, available, poll]);

  useEffect(() => {
    if (!media?.playing) return;
    const timer = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(timer);
  }, [media?.playing]);

  const control = useCallback(async (action: MediaAction) => {
    if (!available) return;
    try { await invoke('media_control', { action }); } catch { /* the app ignored the command */ }
    window.setTimeout(() => { void poll(); }, 250);
  }, [available, poll]);

  const elapsed = media?.playing ? Math.max(0, now - receivedAt.current) / 1000 : 0;
  const position = media ? Math.min(media.duration || Infinity, media.position + elapsed) : 0;
  return { media, position, control, available };
}
