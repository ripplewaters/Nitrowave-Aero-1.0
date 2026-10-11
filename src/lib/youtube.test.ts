import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl } from './youtube';

describe('parseYouTubeUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=42', 'dQw4w9WgXcQ'],
    ['youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('parses %s', (url, id) => {
    expect(parseYouTubeUrl(url)?.id).toBe(id);
  });

  it.each(['', 'https://vimeo.com/123456', 'https://youtube.com/watch?v=nope'])('rejects %s', (url) => {
    expect(parseYouTubeUrl(url)).toBeNull();
  });

  // Pasted links must never smuggle another host, scheme or script through to the player or the browser.
  it.each([
    'javascript:alert(1)//youtube.com/watch?v=dQw4w9WgXcQ',
    'file:///C:/Windows/System32/calc.exe',
    'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com@evil.example/watch?v=dQw4w9WgXcQ',
    'https://evil.example/?u=https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ"><script>alert(1)</script>',
    'https://www.youtube.com/watch?v=../../etc/passwd',
    `https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=${'a'.repeat(5000)}`,
  ])('rejects hostile input %#', (url) => {
    expect(parseYouTubeUrl(url)).toBeNull();
  });

  it('only ever returns a canonical youtube.com URL', () => {
    expect(parseYouTubeUrl('http://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x#t=3')?.canonicalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});
