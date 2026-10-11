import { invoke, isTauri } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

export type PlatformCapabilities = {
  platform: string;
  systemAudio: boolean;
  systemMedia: boolean;
};

const PREVIEW: PlatformCapabilities = { platform: 'browser', systemAudio: false, systemMedia: false };

export function usePlatformCapabilities() {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>(PREVIEW);
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    void invoke<PlatformCapabilities>('platform_capabilities').then((value) => {
      if (!disposed) setCapabilities(value);
    }).catch(() => { /* Keep unavailable features disabled if the backend cannot answer. */ });
    return () => { disposed = true; };
  }, []);
  return capabilities;
}
