import { invoke, isTauri } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

export type AudioLevels = {
  bass: number;
  mid: number;
  treble: number;
  level: number;
  available: boolean;
};

const SILENCE: AudioLevels = { bass: 0, mid: 0, treble: 0, level: 0, available: false };

export function useAudioLevels(enabled = true): AudioLevels {
  const [levels, setLevels] = useState<AudioLevels>(SILENCE);

  useEffect(() => {
    if (!enabled || !isTauri()) return;
    let disposed = false;
    let pending = false;
    const poll = async () => {
      if (pending) return;
      pending = true;
      try {
        const frame = await invoke<AudioLevels>('audio_levels');
        if (!disposed) setLevels(frame);
      } catch {
        if (!disposed) setLevels(SILENCE);
      } finally {
        pending = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 33);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [enabled]);

  return enabled ? levels : SILENCE;
}
