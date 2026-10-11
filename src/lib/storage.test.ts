// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadPreferences, savePreferences } from './storage';

describe('preferences', () => {
  beforeEach(() => localStorage.clear());

  it('falls back to defaults when nothing is stored', () => {
    expect(loadPreferences()).toMatchObject({ preset: 0, skin: 'ember', accentMode: 'skin', volume: 72 });
  });

  it('round-trips skin, shader and glow settings', () => {
    savePreferences({ ...loadPreferences(), preset: 7, skin: 'aqua', accentMode: 'custom', customAccent: '#12ab34' });
    expect(loadPreferences()).toMatchObject({ preset: 7, skin: 'aqua', accentMode: 'custom', customAccent: '#12ab34' });
  });

  it('sanitises corrupted values', () => {
    localStorage.setItem('nitrowave.preferences.v3', JSON.stringify({ preset: 42, accentMode: 'rainbow', customAccent: 'red', volume: -5 }));
    expect(loadPreferences()).toMatchObject({ preset: 9, accentMode: 'skin', customAccent: '#ff4a2e', volume: 0 });
  });
});
