const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be']);

export type ParsedYouTubeUrl = {
  id: string;
  canonicalUrl: string;
};

export function parseYouTubeUrl(value: string): ParsedYouTubeUrl | null {
  const input = value.trim();
  // Real links are short; refuse anything huge rather than parse it.
  if (!input || input.length > 2048) return null;

  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  let id = '';
  if (host.includes('youtu.be')) {
    id = url.pathname.split('/').filter(Boolean)[0] ?? '';
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v') ?? '';
  } else if (url.pathname.startsWith('/shorts/')) {
    id = url.pathname.split('/')[2] ?? '';
  } else if (url.pathname.startsWith('/embed/')) {
    id = url.pathname.split('/')[2] ?? '';
  } else if (url.pathname.startsWith('/live/')) {
    id = url.pathname.split('/')[2] ?? '';
  }

  if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null;
  return { id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}
