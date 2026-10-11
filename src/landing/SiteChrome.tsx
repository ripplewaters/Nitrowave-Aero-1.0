import { Logo } from './Logo';

// Shared by the landing page and the legal pages. `home` is '' on the landing page (in-page
// anchors) and './' elsewhere, so the same links lead back to index.html sections.
export function WindowBar({ title, tone = 'blue' }: { title: string; tone?: 'blue' | 'chrome' | 'pink' }) {
  return <div className={`window-bar tone-${tone}`}>
    <span className="window-title">{title}</span>
    <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
  </div>;
}

export function SiteHeader({ home = '' }: { home?: string }) {
  return <header className="site-header">
    <a className="wordmark" href={home || '#'} aria-label="Nitrowave Aero home">
      <Logo className="logo-orb" />
      <span className="chrome-text">NITROWAVE</span><span className="wordmark-aero">aero</span>
    </a>
    <nav aria-label="Main navigation">
      <a href={`${home}#skins`}>Skins</a><a href={`${home}#worlds`}>Worlds</a><a href={`${home}#features`}>Player</a><a href={`${home}#faq`}>Help</a>
      <a className="nav-download" href={`${home}#download`}>Download</a>
    </nav>
  </header>;
}

export function SiteFooter({ home = '' }: { home?: string }) {
  return <footer className="site-footer">
    <div className="badges" aria-label="Compatibility">
      <span className="badge b-win">WIN<b>10/11</b></span>
      <span className="badge b-gl">WEBGL<b>2.0</b></span>
      <span className="badge b-off">OFFLINE<b>READY</b></span>
      <span className="badge b-spk">SPEAKERS<b>ON ♪</b></span>
    </div>
    <div className="footer-copy"><p><span className="chrome-text">NITROWAVE</span> aero · Free for Windows · Mac preview · © 2026 Nitrowave</p><p className="legal-note">Nitrowave is not affiliated with Spotify, YouTube, Google, Apple or Microsoft. Their names are trademarks of their respective owners and are used only to describe compatibility.</p></div>
    <nav aria-label="Footer"><a href="./license.html">License</a><a href="./privacy.html">Privacy</a><a href="./notices.html">Notices</a><a href="https://github.com/ripplewaters/Nitrowave-Aero-1.0">Source on GitHub</a><a href="https://github.com/ripplewaters/Nitrowave-Aero-1.0/issues">Contact / report a bug</a><a href={`${home}#download`}>Download</a><a href="#">Back to top ▲</a></nav>
  </footer>;
}
