// Windows identifies media apps by an AppUserModelID such as "Spotify.exe",
// "SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify" or "MSEdge". Turn it into a short label.
const KNOWN: [RegExp, string][] = [
  [/spotify/i, 'SPOTIFY'],
  [/msedge/i, 'EDGE'],
  [/chrome/i, 'CHROME'],
  [/firefox|308046B0AF4A39CB/i, 'FIREFOX'],
  [/opera/i, 'OPERA'],
  [/brave/i, 'BRAVE'],
  [/vivaldi/i, 'VIVALDI'],
  [/zunemusic|mediaplayer/i, 'MEDIA PLAYER'],
  [/applemusic|itunes/i, 'APPLE MUSIC'],
  [/tidal/i, 'TIDAL'],
  [/deezer/i, 'DEEZER'],
  [/vlc/i, 'VLC'],
  [/foobar/i, 'FOOBAR2000'],
  [/winamp/i, 'WINAMP'],
];

export function appLabel(id: string): string {
  for (const [pattern, label] of KNOWN) if (pattern.test(id)) return label;
  const name = id.split(/[\\/!]/).filter(Boolean).pop()?.replace(/\.exe$/i, '').replace(/_[a-z0-9]{13}$/i, '') ?? '';
  const clean = name.replace(/[^\p{L}\p{N} .-]/gu, '').trim().toUpperCase();
  return clean ? clean.slice(0, 14) : 'ANOTHER APP';
}
