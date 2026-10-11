// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { usePlatformCapabilities } from './usePlatformCapabilities';
import { useAudioLevels } from './useAudioLevels';
import { useSystemMedia } from './useSystemMedia';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn() }));

function Probe() {
  const capabilities = usePlatformCapabilities();
  const levels = useAudioLevels(capabilities.systemAudio);
  const system = useSystemMedia(true, capabilities.systemMedia);
  return <output>{JSON.stringify({ capabilities, levels, media: system.media })}</output>;
}

describe('platform feature gating', () => {
  let root: Root;
  let host: HTMLDivElement;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockReset();
    vi.mocked(isTauri).mockReturnValue(true);
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.useRealTimers();
  });

  it('does not poll missing native commands in a Mac preview', async () => {
    vi.mocked(invoke).mockResolvedValue({ platform: 'macos', systemAudio: false, systemMedia: false });
    await act(async () => root.render(<Probe />));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(vi.mocked(invoke).mock.calls.map(([command]) => command)).toEqual(['platform_capabilities']);
    expect(host.textContent).toContain('macos');
    expect(host.textContent).toContain('"available":false');
  });

  it('keeps Windows capture and media polling enabled', async () => {
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === 'platform_capabilities') return { platform: 'windows', systemAudio: true, systemMedia: true };
      if (command === 'audio_levels') return { bass: 0.3, mid: 0.2, treble: 0.1, level: 0.4, available: true };
      return { title: 'Test song', artist: 'Artist', app: 'Spotify', playing: false, position: 0, duration: 120 };
    });
    await act(async () => root.render(<Probe />));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(invoke).toHaveBeenCalledWith('audio_levels');
    expect(invoke).toHaveBeenCalledWith('media_session');
    expect(host.textContent).toContain('Test song');
    expect(host.textContent).toContain('"available":true');
  });

  it('does not invoke native APIs in a browser', async () => {
    vi.mocked(isTauri).mockReturnValue(false);
    await act(async () => root.render(<Probe />));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(invoke).not.toHaveBeenCalled();
  });

  it('keeps native polling off if capability discovery fails', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Backend unavailable'));
    await act(async () => root.render(<Probe />));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(vi.mocked(invoke).mock.calls.map(([command]) => command)).toEqual(['platform_capabilities']);
  });
});
