const STORAGE_KEY = 'nitrowave.preferences.v3';

export type WindowMode = 'normal' | 'pin' | 'desktop';
export type AccentMode = 'skin' | 'shader' | 'custom';

export type Preferences = {
  videoUrl: string;
  volume: number;
  muted: boolean;
  mode: WindowMode;
  width: number;
  height: number;
  x?: number;
  y?: number;
  preset: number;
  skin: string;
  accentMode: AccentMode;
  customAccent: string;
};

const defaults: Preferences = {
  videoUrl: '',
  volume: 72,
  muted: false,
  mode: 'normal',
  width: 500,
  height: 560,
  preset: 0,
  skin: 'ember',
  accentMode: 'skin',
  customAccent: '#ff4a2e',
};

export function loadPreferences(): Preferences {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const raw = current ?? localStorage.getItem('nitrowave.preferences.v2') ?? localStorage.getItem('nitrowave.preferences.v1');
    if (!raw) return defaults;
    const stored = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...defaults,
      ...stored,
      volume: clampNumber(stored.volume, defaults.volume, 0, 100),
      width: current ? clampNumber(stored.width, defaults.width, 210, 500) : defaults.width,
      height: current ? clampNumber(stored.height, defaults.height, 235, 560) : defaults.height,
      preset: Math.round(clampNumber(stored.preset, defaults.preset, 0, 9)),
      skin: typeof stored.skin === 'string' ? stored.skin : defaults.skin,
      accentMode: stored.accentMode === 'shader' || stored.accentMode === 'custom' ? stored.accentMode : 'skin',
      customAccent: typeof stored.customAccent === 'string' && /^#[0-9a-f]{6}$/i.test(stored.customAccent) ? stored.customAccent : defaults.customAccent,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Local storage can be unavailable in a locked-down WebView; playback still works.
  }
}

function clampNumber(value: number | undefined, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
