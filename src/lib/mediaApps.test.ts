import { describe, expect, it } from 'vitest';
import { appLabel } from './mediaApps';

describe('appLabel', () => {
  it.each([
    ['Spotify.exe', 'SPOTIFY'],
    ['SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify', 'SPOTIFY'],
    ['MSEdge', 'EDGE'],
    ['Chrome', 'CHROME'],
    ['308046B0AF4A39CB', 'FIREFOX'],
    ['Microsoft.ZuneMusic_8wekyb3d8bbwe!Microsoft.ZuneMusic', 'MEDIA PLAYER'],
    ['C:\\Apps\\Cool Player\\coolplayer.exe', 'COOLPLAYER'],
    ['', 'ANOTHER APP'],
  ])('labels %s', (id, label) => {
    expect(appLabel(id)).toBe(label);
  });

  it('strips markup and keeps labels short', () => {
    const label = appLabel('<script>alert(1)</script>VeryLongPlayerNameThatGoesOn.exe');
    expect(label).not.toMatch(/[<>()]/);
    expect(label.length).toBeLessThanOrEqual(14);
  });
});
