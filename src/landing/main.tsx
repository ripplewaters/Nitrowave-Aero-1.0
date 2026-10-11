import { StrictMode, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/audiowide/index.css';
import '@fontsource/vt323/index.css';
import '@fontsource/orbitron/600.css';
import '@fontsource/orbitron/700.css';
import '../skins/aero2004/aero2004.css';
import { SKINS, type Skin } from '../skins/skins';
import { DevicePreview } from './DevicePreview';
import { SiteFooter, SiteHeader, WindowBar } from './SiteChrome';
import { SHADER_PRESETS, type ShaderPresetIndex } from '../components/shaderPresets';
import release from '../../landing/release.json';
import './landing.css';

const WORLDS = [
  'Glide over a sunset sea of clouds.',
  'Neon signs and lit windows on an endless boulevard.',
  'The same streets after midnight, slick with rain.',
  'Moonlit peaks and a snowfield rushing past.',
  'Blue skies, rolling swells and sun on the water.',
  'A striped retro sun over mesas and an open road.',
  'The classic synthwave grid, beating with the bass.',
  'Light-speed streaks that surge on every kick.',
  'Glowing rings racing towards you through a bending tube.',
  'Northern lights rippling over a still, dark sea.',
];
const ticker = ['NITROWAVE AERO 1.0 IS OUT NOW', `${SKINS.length} SKINS`, `${SHADER_PRESETS.length} AUDIO-REACTIVE VISUAL WORLDS`, '100% FREE', 'MADE FOR WINDOWS 10 / 11', 'NO ACCOUNT NEEDED', 'TURN IT UP'];
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Sparkle({ style, size = 'm' }: { style: CSSProperties; size?: 's' | 'm' | 'l' }) {
  return <svg className={`sparkle sparkle-${size}`} style={style} viewBox="-1 -1 2 2" aria-hidden="true"><path d="M0-1C.1-.1.1-.1 1 0C.1.1.1.1 0 1C-.1.1-.1.1-1 0C-.1-.1-.1-.1 0-1Z" /></svg>;
}

function Download({ big = false }: { big?: boolean }) {
  return <a className={`gel-button${big ? ' big' : ''}`} href={`./${release.file}`} download>
    <span className="gel-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg></span>
    <span className="gel-label"><span>Download for Windows</span><small>FREE · v{release.version} · {release.sizeMB} MB</small></span>
  </a>;
}

const swatch = (skin: Skin): CSSProperties => ({ background: `radial-gradient(circle at 50% 50%, ${skin.accent} 0 22%, transparent 24%), linear-gradient(135deg, ${skin.vars['--panel-hi']} 0%, ${skin.vars['--panel']} 40%, ${skin.vars['--body']} 41%, ${skin.vars['--body-lo']} 100%)` });
const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const inWords = (n: number) => NUMBER_WORDS[n] ?? String(n);
const pad = (n: number) => String(n + 1).padStart(2, '0');

// Each world is a still captured from the real shader (landing/public/worlds), so the page only
// runs one live shader, in the hero. "Tune in" plays the world there.
function WorldTile({ index, selected, onTune }: { index: ShaderPresetIndex; selected: boolean; onTune: () => void }) {
  const preset = SHADER_PRESETS[index];
  return <article className={`world-tile${selected ? ' is-tuned' : ''}`} style={{ '--world': preset.color } as CSSProperties}>
    <div className="world-orb"><div className="world-glass">
      <img src={`./worlds/${pad(index)}.jpg`} width="480" height="480" loading="lazy" decoding="async" alt={`${preset.name}: ${WORLDS[index]}`} />
      <span className="world-fx" aria-hidden="true">FX {pad(index)}</span>
    </div></div>
    <h3>{preset.name}</h3>
    <p>{WORLDS[index]}</p>
    <button type="button" className="mini-gel" onClick={onTune} aria-label={`Show ${preset.name.toLowerCase()} in the preview`}>{selected ? '✓ ON AIR' : 'TUNE IN ▸'}</button>
  </article>;
}

function Landing() {
  const [selected, setSelected] = useState(() => Math.max(0, SKINS.findIndex((item) => item.id === 'aqua')));
  const [world, setWorld] = useState<ShaderPresetIndex>(6);
  const skin = SKINS[selected];
  const toHero = () => document.getElementById('hero-stage')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'center' });
  const pick = (i: number, scroll = false) => { setSelected(i); if (scroll) toHero(); };
  const tune = (i: number, scroll = false) => { setWorld(((i + SHADER_PRESETS.length) % SHADER_PRESETS.length) as ShaderPresetIndex); if (scroll) toHero(); };
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="ticker" aria-label="Release highlights">
      <div className="ticker-track" aria-hidden="true">{[0, 1].map((copy) => <span key={copy}>{ticker.map((item) => <span key={item}>{item}<b>✦</b></span>)}</span>)}</div>
      <span className="visually-hidden">{ticker.join('. ')}</span>
    </div>

    <SiteHeader />

    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="starfield" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="pixel-chip"><span className="blink-dot" /> A NEW FREQUENCY FOR YOUR DESKTOP</p>
          <h1 id="hero-title"><span className="chrome-text">Your music.</span><span className="chrome-text">A whole new</span><span className="holo-text">dimension.</span></h1>
          <p className="hero-description">A little music machine with a big personality. {SKINS.length} moulded skins, {SHADER_PRESETS.length} living visual worlds, and your music right in the middle of it all.</p>
          <div className="hero-actions"><Download /><a className="ghost-link" href="#worlds">See all worlds <span aria-hidden="true">↓</span></a></div>
          <p className="pixel-meta">WINDOWS 10 / 11 · 64-BIT · v{release.version}</p>
        </div>

        <div className="hero-art" id="hero-stage">
          <div className="halo" aria-hidden="true" />
          <div className="orbit-ring ring-a" aria-hidden="true" /><div className="orbit-ring ring-b" aria-hidden="true" />
          <Sparkle size="l" style={{ top: '9%', left: '14%' }} /><Sparkle style={{ top: '22%', right: '8%', animationDelay: '-1.2s' }} />
          <Sparkle size="s" style={{ bottom: '28%', left: '6%', animationDelay: '-.6s' }} /><Sparkle style={{ bottom: '18%', right: '14%', animationDelay: '-2s' }} />
          <div className="sticker" aria-hidden="true"><span>NEW!<br /><small>v{release.version}</small></span></div>
          <div className="hero-device"><DevicePreview skin={skin} preset={world} live /></div>
          <div className="device-reflection" aria-hidden="true" />
          <div className="now-showing">
            <button type="button" onClick={() => tune(world - 1)} aria-label="Previous visual world">◂</button>
            <p aria-live="polite"><span>NOW SHOWING</span> <strong>{skin.name}</strong> <em>× {SHADER_PRESETS[world].name}</em></p>
            <button type="button" onClick={() => tune(world + 1)} aria-label="Next visual world">▸</button>
          </div>
        </div>

        <div className="orb-picker" role="group" aria-label="Choose a skin for the preview">
          {SKINS.map((item, i) => <button key={item.id} type="button" aria-pressed={selected === i} onClick={() => pick(i)} className={selected === i ? 'active' : ''}>
            <i className="candy" style={swatch(item)} aria-hidden="true" /><span>{item.name}</span>
          </button>)}
        </div>
      </section>

      <div className="lcd-strip" aria-label="At a glance">
        {[[String(SKINS.length), 'SKINS'], [String(SHADER_PRESETS.length), 'VISUAL WORLDS'], ['3', 'WINDOW SIZES'], ['0', 'ACCOUNTS NEEDED']].map(([n, label]) => <div className="lcd" key={label}><b>{n}</b><span>{label}</span></div>)}
      </div>

      <section className="skins-zone" id="skins" aria-labelledby="skins-title">
        <div className="bubbles" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
        <div className="section-wrap">
          <div className="section-heading light">
            <p className="pixel-chip dark">01 ▸ THE SKIN COLLECTION</p>
            <h2 id="skins-title" className="bubble-text">{inWords(SKINS.length)} shells.<br />Pick your mood.</h2>
            <p>Every skin recolours the whole sculpture, from the wings to the bezel to the glow. Flip through them with the arrows on the title strip whenever the mood shifts.</p>
          </div>
          <div className="skin-windows">{SKINS.map((item, i) => <article className={`skin-window${selected === i ? ' is-loaded' : ''}`} key={item.id}>
            <WindowBar title={`${item.name}.SKN`} tone={i % 2 ? 'pink' : 'blue'} />
            <div className="skin-stage"><DevicePreview skin={item} /></div>
            <div className="skin-copy">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <button type="button" className="mini-gel" onClick={() => pick(i, true)} aria-label={`Load the ${item.name.toLowerCase()} skin in the preview`}>{selected === i ? '✓ LOADED' : 'LOAD SKIN ▸'}</button>
            </div>
          </article>)}</div>
          <p className="collection-footnote">All {SKINS.length} ship inside the player. Match the glow to the skin, the visual world or a colour of your own.</p>
        </div>
      </section>

      <section className="worlds-zone" id="worlds" aria-labelledby="worlds-title">
        <div className="section-wrap">
          <div className="section-heading">
            <p className="pixel-chip">02 ▸ {SHADER_PRESETS.length} VISUAL WORLDS</p>
            <h2 id="worlds-title"><span className="chrome-text">{inWords(SHADER_PRESETS.length)} worlds.</span> <span className="holo-text">One beat.</span></h2>
            <p className="worlds-lede">Every world is a live shader inside the orb. Bass, mids and treble steer the scene and every kick drum lands. Press Tune in to watch one live in the player above.</p>
          </div>
          <div className="world-grid">{SHADER_PRESETS.map((_, i) => <WorldTile key={i} index={i as ShaderPresetIndex} selected={world === i} onTune={() => tune(i, true)} />)}</div>
        </div>
      </section>

      <section className="features section-wrap" id="features" aria-labelledby="features-title">
        <div className="section-heading">
          <p className="pixel-chip">03 ▸ SMALL OBJECT. BIG FEELING.</p>
          <h2 id="features-title"><span className="chrome-text">More life.</span> <span className="holo-text">Less space.</span></h2>
        </div>
        <div className="feature-tiles">
          {[
            ['orb-cyan', '∿', 'Sound into scenery', 'Ten visual worlds, from neon streets to northern lights. Whatever you play, the scene answers your bass, mids and treble.'],
            ['orb-lime', '▶', 'Plays well with others', 'Play a file from your computer, or keep Spotify, your browser or any music app going. Nitrowave shows the song and its buttons control the app.'],
            ['orb-pink', '◎', 'A desktop companion', 'A sculpted shell on a transparent background. Park it anywhere and flip between three sizes.'],
            ['orb-violet', '✦', 'Your own frequency', `Pick from ${SKINS.length} skins and match the glow to the shell, the visual world or a colour of your own. Nitrowave remembers.`],
          ].map(([orb, icon, title, text]) => <article className="feature-tile" key={title}>
            <span className={`gel-orb ${orb}`} aria-hidden="true">{icon}</span>
            <h3>{title}</h3><p>{text}</p>
          </article>)}
        </div>
      </section>

      <section className="download-zone" id="download" aria-labelledby="download-title">
        <div className="burst" aria-hidden="true" />
        <Sparkle size="l" style={{ top: '16%', left: '18%' }} /><Sparkle style={{ top: '30%', right: '16%', animationDelay: '-1.5s' }} /><Sparkle size="s" style={{ bottom: '22%', left: '26%', animationDelay: '-.8s' }} />
        <div className="download-inner">
          <p className="pixel-chip">04 ▸ TUNE IN</p>
          <h2 id="download-title"><span className="chrome-text">Give your desktop</span><span className="holo-text">a pulse of its own.</span></h2>
          <Download big />
          <div className="file-window">
            <WindowBar title="SETUP.EXE — PROPERTIES" tone="chrome" />
            <dl>
              <div><dt>Version</dt><dd>{release.version}</dd></div>
              <div><dt>Size</dt><dd>{release.sizeMB} MB</dd></div>
              <div><dt>System</dt><dd>Windows 10 / 11 · x64</dd></div>
              <div><dt>SHA-256</dt><dd className="hash" title={release.sha256}>{release.sha256.slice(0, 16)}…{release.sha256.slice(-8)}</dd></div>
            </dl>
            <p>If WebView2 is missing, the installer sets it up for you (this may need an internet connection). The installer is not code-signed yet, so Windows SmartScreen may ask you to confirm.</p>
            <div className="file-links"><a href="./downloads/SHA256SUMS.txt" download>SHA-256 checksum ↗</a><a href="./license.html">License terms ↗</a><a href="./privacy.html">Privacy ↗</a><a href="./notices.html">Open-source notices ↗</a></div>
          </div>
        </div>
      </section>

      <section className="faq section-wrap" id="faq" aria-labelledby="faq-title">
        <div className="help-window">
          <WindowBar title="HELP.TXT" tone="blue" />
          <div className="help-body">
            <h2 id="faq-title">Before you press play.</h2>
            <details><summary>Which computers does it work on?</summary><p>Windows 10 or 11 with a 64-bit Intel or AMD processor, WebView2 and WebGL 2 support. This download is the Windows version.</p></details>
            <details><summary>Does it work with Spotify and YouTube?</summary><p>Yes. Play music in Spotify, YouTube in your browser or any other app, and Nitrowave follows along: the orb shows the song from Windows' media controls, the transport buttons control that app, and the visuals react to what your speakers play. Nitrowave never signs in to or streams from those services, and pasted YouTube links open in your browser.</p></details>
            <details><summary>Why does the preview move without music?</summary><p>The website preview runs a gentle ambient animation. In the player, local audio files drive the visuals directly. Music from other apps is followed through Windows system audio, which can include other sounds too.</p></details>
            <details><summary>How do I change skins and visuals?</summary><p>Use the arrows beside the player title to change skins and the arrows by the controls to change visual worlds. The FX button opens settings. The left and right arrow keys also switch visuals.</p></details>
            <details><summary>Do I need an internet connection?</summary><p>Local audio files and skins work offline once the player and WebView2 are installed. Music from other apps works however those apps work. Nitrowave itself does not need the internet.</p></details>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Landing /></StrictMode>);
