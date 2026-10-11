import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The static site loads nothing from other origins. Dev keeps Vite's inline HMR preamble working,
// so the policy is only written into the production build. Hosts should also send it as a header.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
const csp: Plugin = {
  name: 'nitrowave-csp',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />`),
};

export default defineConfig({
  root: 'landing',
  base: './',
  plugins: [react(), csp],
  publicDir: 'public',
  resolve: { alias: { '/src': resolve('src') } },
  server: { host: '127.0.0.1', port: 1421, strictPort: true, fs: { allow: ['..'] } },
  build: {
    outDir: '../site-dist',
    emptyOutDir: true,
    rollupOptions: { input: Object.fromEntries(['index', 'license', 'privacy', 'notices'].map((page) => [page, resolve('landing', `${page}.html`)])) },
  },
});
