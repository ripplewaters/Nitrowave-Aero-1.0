import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioLevels } from './useAudioLevels';
import type { PlayerSnapshot } from './types';

const SILENCE: AudioLevels = { bass: 0, mid: 0, treble: 0, level: 0, available: false };

export function useLocalAudio(initialVolume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [levels, setLevels] = useState<AudioLevels>(SILENCE);
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>({
    status: 'idle', currentTime: 0, duration: 0, volume: initialVolume, muted: false,
    title: 'NO AUDIO FILE', error: '',
  });

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = initialVolume / 100;
    audioRef.current = audio;
    const update = () => setSnapshot((current) => ({ ...current,
      currentTime: audio.currentTime || 0, duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    }));
    const playing = () => setSnapshot((current) => ({ ...current, status: 'playing', error: '' }));
    const paused = () => setSnapshot((current) => ({ ...current, status: audio.ended ? 'ended' : 'paused' }));
    const failed = () => setSnapshot((current) => ({ ...current, status: 'error', error: 'AUDIO FILE COULD NOT PLAY' }));
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('play', playing);
    audio.addEventListener('pause', paused);
    audio.addEventListener('ended', paused);
    audio.addEventListener('error', failed);
    let frame = 0;
    const analyze = () => {
      frame = requestAnimationFrame(analyze);
      const analyser = analyserRef.current;
      if (!analyser || audio.paused) { setLevels((current) => current.level > 0 ? { ...SILENCE, available: !!analyser } : current); return; }
      const bins = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins);
      const waveform = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(waveform);
      let energy = 0;
      for (const sample of waveform) energy += sample * sample;
      const level = Math.min(1, Math.sqrt(energy / waveform.length) * 5);
      const hzPerBin = (contextRef.current?.sampleRate || 48000) / analyser.fftSize;
      const band = (low: number, high: number) => {
        const start = Math.max(0, Math.floor(low / hzPerBin));
        const end = Math.min(bins.length, Math.ceil(high / hzPerBin));
        let sum = 0;
        for (let i = start; i < end; i++) sum += bins[i];
        return Math.min(1, sum / Math.max(1, end - start) / 170);
      };
      setLevels({ bass: band(30, 180), mid: band(180, 2000), treble: band(2000, 9000), level, available: true });
    };
    frame = requestAnimationFrame(analyze);
    return () => {
      cancelAnimationFrame(frame); audio.pause(); audio.removeAttribute('src'); audio.load();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      void contextRef.current?.close(); audioRef.current = null;
    };
  }, [initialVolume]);

  const loadFile = useCallback(async (file: File): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(file.name)) {
      setSnapshot((current) => ({ ...current, status: 'error', error: 'CHOOSE AN AUDIO FILE' }));
      return false;
    }
    try {
      if (!contextRef.current) {
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        context.createMediaElementSource(audio).connect(analyser);
        analyser.connect(context.destination);
        contextRef.current = context; analyserRef.current = analyser;
      }
      await contextRef.current.resume();
      audio.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = URL.createObjectURL(file);
      audio.src = objectUrlRef.current;
      audio.load();
      setSnapshot((current) => ({ ...current, status: 'loading', title: file.name.replace(/\.[^.]+$/, ''), error: '', currentTime: 0, duration: 0 }));
      await audio.play();
      return true;
    } catch (error) {
      setSnapshot((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : 'AUDIO FILE COULD NOT PLAY' }));
      return false;
    }
  }, []);

  const play = useCallback(() => { void audioRef.current?.play(); }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const seek = useCallback((seconds: number) => { if (audioRef.current) audioRef.current.currentTime = seconds; }, []);
  const setVolume = useCallback((volume: number) => {
    const next = Math.min(100, Math.max(0, volume));
    if (audioRef.current) audioRef.current.volume = next / 100;
    setSnapshot((current) => ({ ...current, volume: next, muted: next === 0 }));
  }, []);

  return { snapshot, levels, loadFile, play, pause, seek, setVolume };
}
