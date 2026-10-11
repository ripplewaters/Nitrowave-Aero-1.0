import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type WheelEvent } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { ShaderVisual } from './components/ShaderVisual';
import { ShellArt, ShellGlow } from './components/ShellArt';
import { ARCH_PATH, onArch } from './components/titleArch';
import { SHADER_PRESETS, type ShaderPresetIndex } from './components/shaderPresets';
import { formatClock, parseYouTubeUrl } from './lib/youtube';
import { loadPreferences, savePreferences, type AccentMode, type Preferences } from './lib/storage';
import { useLocalAudio } from './player/useLocalAudio';
import { useAudioLevels } from './player/useAudioLevels';
import { usePlatformCapabilities } from './player/usePlatformCapabilities';
import { useSystemMedia, type MediaAction } from './player/useSystemMedia';
import { appLabel } from './lib/mediaApps';
import { SKINS, findSkin } from './skins/skins';
import { closeWindow, cycleWindowSize, minimizeWindow, restoreWindowGeometry, startWindowDrag, watchWindowGeometry } from './window/windowModes';
import './skins/aero2004/aero2004.css';

type IconName = 'restart' | 'previous' | 'play' | 'pause' | 'next' | 'repeat' | 'left' | 'right' | 'music';
// file = an audio file played inside Nitrowave; system = whatever another app is playing.
// YouTube links open in the browser; YouTube's API policies do not allow embedded hidden players.
type Source = 'file' | 'system';
type PanelTab = 'music' | 'visual' | 'skin';

function Icon({ name }: { name: IconName }) {
  const shared = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'music') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12.5 23.5V8.5l13-3.5v15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /><path d="M12.5 12.3l13-3.5" stroke="currentColor" strokeWidth="2.6" /><ellipse cx="9" cy="23.5" rx="4" ry="3.3" fill="currentColor" /><ellipse cx="22" cy="20" rx="4" ry="3.3" fill="currentColor" /></svg>;
  if (name === 'play') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 5 27 16 10 27Z" fill="currentColor" /></svg>;
  if (name === 'pause') return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8" y="5" width="5" height="22" rx="1.5" fill="currentColor" /><rect x="19" y="5" width="5" height="22" rx="1.5" fill="currentColor" /></svg>;
  if (name === 'previous') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 7 5 16l11 9ZM28 7 17 16l11 9Z" fill="currentColor" /></svg>;
  if (name === 'next') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 7l11 9-11 9ZM16 7l11 9-11 9Z" fill="currentColor" /></svg>;
  if (name === 'left') return <svg viewBox="0 0 32 32" aria-hidden="true" {...shared} strokeWidth={3.4}><path d="M19 7 10 16l9 9" /></svg>;
  if (name === 'right') return <svg viewBox="0 0 32 32" aria-hidden="true" {...shared} strokeWidth={3.4}><path d="M13 7l9 9-9 9" /></svg>;
  if (name === 'restart') return <svg viewBox="0 0 32 32" aria-hidden="true" {...shared}><path d="M7 16a9 9 0 1 0 3-6.7M7 5v5h5" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true" {...shared}><path d="M26 12a11 11 0 0 0-19-3l-3 3m0-7v7h7M6 20a11 11 0 0 0 19 3l3-3m0 7v-7h-7" /></svg>;
}

// Dark text on light glow colours (lime, white) and light text on saturated ones.
function onAccent(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  const luminance = (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255;
  return luminance > 0.62 ? '#161616' : '#ffffff';
}

function App() {
  const initial = useRef<Preferences>(loadPreferences()).current;
  const fileRef = useRef<HTMLInputElement>(null);
  const preferencesRef = useRef(initial);
  const [source, setSource] = useState(initial.videoUrl);
  const [panel, setPanel] = useState<PanelTab | null>(null);
  const [activeSource, setActiveSource] = useState<Source>('system');
  const [externalError, setExternalError] = useState('');
  const [preset, setPreset] = useState<ShaderPresetIndex>(initial.preset as ShaderPresetIndex);
  const [skinId, setSkinId] = useState(initial.skin);
  const [accentMode, setAccentMode] = useState<AccentMode>(initial.accentMode);
  const [customAccent, setCustomAccent] = useState(initial.customAccent);
  const [repeat, setRepeat] = useState(false);
  const [flash, setFlash] = useState<{ text: string; id: number } | null>(null);
  const local = useLocalAudio(initial.volume);
  const capabilities = usePlatformCapabilities();
  const systemLevels = useAudioLevels(capabilities.systemAudio);
  const system = useSystemMedia(activeSource === 'system', capabilities.systemMedia);

  const inSystem = activeSource === 'system';
  const player = local;
  const media = inSystem ? system.media : null;
  const snapshot = inSystem
    ? { ...local.snapshot, status: media ? (media.playing ? 'playing' as const : 'paused' as const) : 'idle' as const, title: media?.title || media?.artist || 'NITROWAVE', currentTime: system.position, duration: media?.duration ?? 0, error: externalError }
    : player.snapshot;
  // Native capture follows other apps where supported; local files use Web Audio.
  const levels = activeSource === 'file' ? local.levels : systemLevels;
  const skin = findSkin(skinId);
  const accent = accentMode === 'shader' ? SHADER_PRESETS[preset].color : accentMode === 'custom' ? customAccent : skin.accent;

  useEffect(() => {
    if (capabilities.platform === 'macos' && !capabilities.systemAudio) {
      setActiveSource((current) => current === 'system' ? 'file' : current);
    }
  }, [capabilities.platform, capabilities.systemAudio]);

  useEffect(() => {
    void restoreWindowGeometry(initial);
    let stopWatching: (() => void) | undefined;
    void watchWindowGeometry((geometry) => {
      preferencesRef.current = { ...preferencesRef.current, ...geometry };
      savePreferences(preferencesRef.current);
    }).then((cleanup) => { stopWatching = cleanup; });
    return () => stopWatching?.();
  }, [initial]);

  useEffect(() => {
    preferencesRef.current = { ...preferencesRef.current, videoUrl: source, volume: snapshot.volume, muted: snapshot.muted, preset, skin: skinId, accentMode, customAccent };
    savePreferences(preferencesRef.current);
  }, [snapshot.muted, snapshot.volume, source, preset, skinId, accentMode, customAccent]);

  const playerRef = useRef(player);
  playerRef.current = player;
  useEffect(() => {
    if (repeat && snapshot.status === 'ended' && !inSystem) { playerRef.current.seek(0); playerRef.current.play(); }
  }, [repeat, snapshot.status, inSystem]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 1500);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
      if ((event.target as HTMLElement).closest('input')) return;
      if (event.key === 'ArrowLeft') cycleShaderRef.current(-1);
      if (event.key === 'ArrowRight') cycleShaderRef.current(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const followSystem = () => {
    if (!capabilities.systemAudio) return;
    local.pause();
    setExternalError('');
    setActiveSource('system');
    setPanel(null);
  };
  // YouTube plays in the user's browser; Nitrowave follows along through system audio.
  const openYouTube = async () => {
    const parsed = parseYouTubeUrl(source);
    if (!parsed) { setExternalError('INVALID YOUTUBE URL'); return; }
    try {
      if (isTauri()) await invoke('open_youtube', { videoId: parsed.id });
      else if (!window.open(parsed.canonicalUrl, '_blank', 'noopener,noreferrer')) throw new Error('BROWSER BLOCKED YOUTUBE WINDOW');
      followSystem();
    } catch (error) {
      setExternalError(error instanceof Error ? error.message : 'COULD NOT OPEN YOUTUBE');
    }
  };
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setExternalError('');
    setActiveSource('file');
    if (await local.loadFile(file)) setPanel(null);
  };
  const showFlash = (text: string) => setFlash((current) => ({ text, id: (current?.id ?? 0) + 1 }));
  const cycleShader = (direction: 1 | -1) => {
    const next = ((preset + direction + SHADER_PRESETS.length) % SHADER_PRESETS.length) as ShaderPresetIndex;
    setPreset(next);
    showFlash(`${String(next + 1).padStart(2, '0')} ${SHADER_PRESETS[next].name}`);
  };
  const cycleSkin = (direction: 1 | -1) => {
    const index = SKINS.findIndex((item) => item.id === skin.id);
    const next = SKINS[(index + direction + SKINS.length) % SKINS.length];
    setSkinId(next.id);
    showFlash(`SKIN ${next.name}`);
  };
  const cycleShaderRef = useRef(cycleShader);
  cycleShaderRef.current = cycleShader;
  const setVolume = (volume: number) => { local.setVolume(volume); };
  const togglePanel = (tab: PanelTab) => setPanel((open) => open === tab ? null : tab);

  const transportDisabled = snapshot.status === 'idle';
  const playing = snapshot.status === 'playing' || snapshot.status === 'buffering';
  const press = (action: MediaAction, playerAction: () => void) => { if (inSystem) void system.control(action); else playerAction(); };
  const duration = snapshot.duration || 1;
  const shellStyle = {
    ...skin.vars,
    '--accent': accent,
    '--on-accent': onAccent(accent),
    '--preset-color': SHADER_PRESETS[preset].color,
    '--audio-level': levels.level.toFixed(3),
    '--audio-brightness': (1 + levels.level * 1.45).toFixed(2),
  } as CSSProperties;
  const statusLine = snapshot.error ? snapshot.error
    : snapshot.status === 'idle' ? SHADER_PRESETS[preset].name
    : media ? [media.title ? media.artist : '', appLabel(media.app)].filter(Boolean).join(' · ')
    : snapshot.status.toUpperCase();

  const dragShell = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button,input,form,.optical-window,.control-deck,.source-popover')) return;
    void startWindowDrag();
  };
  const wheelVolume = (event: WheelEvent<HTMLDivElement>) => {
    if (!inSystem) setVolume(snapshot.volume + (event.deltaY < 0 ? 5 : -5));
  };

  return <main className="nitro-stage">
    <div className="device-shell" data-skin={skin.id} data-finish={skin.finish} style={shellStyle} onMouseDown={dragShell}>
      <ShellArt finish={skin.finish} />
      <ShellGlow />

      <svg className="title-text" viewBox="0 0 1000 1100" preserveAspectRatio="none" aria-hidden="true">
        <path id="nw-title-arch" d={ARCH_PATH} fill="none" />
        <text dy="2"><textPath href="#nw-title-arch" startOffset="46%" textAnchor="middle">NITROWAVE <tspan className="aero">AERO</tspan></textPath></text>
      </svg>
      <header className="title-arch" aria-label="Nitrowave Aero">
        <button className="arch-button arrow" style={onArch(-24)} type="button" onClick={() => cycleSkin(-1)} aria-label="Previous skin" title="Previous skin"><Icon name="left" /></button>
        <button className={`music-button${snapshot.status === 'idle' ? ' empty' : ''}${panel === 'music' ? ' open' : ''}`} style={onArch(-19.4)} type="button" onClick={() => togglePanel('music')} aria-label="Load music" aria-expanded={panel === 'music'} title="Load music"><Icon name="music" /></button>
        <button className="arch-button" style={onArch(14.4)} type="button" onClick={() => void minimizeWindow()} aria-label="Minimize window">−</button>
        <button className="arch-button" style={onArch(19.2)} type="button" onClick={() => void closeWindow()} aria-label="Close window">×</button>
        <button className="arch-button arrow" style={onArch(24)} type="button" onClick={() => cycleSkin(1)} aria-label="Next skin" title="Next skin"><Icon name="right" /></button>
      </header>

      <section className="optical-bezel" aria-label="Visual display">
        <div className="bezel-metal"><div className="bezel-light"><div className="optical-window" onWheel={wheelVolume}>
          <ShaderVisual preset={preset} levels={levels} active />
          <div className="optical-vignette" aria-hidden="true" />
          {flash && <div className="orb-flash" key={flash.id} role="status">{flash.text}</div>}
          <div className="track-overlay"><h1>{snapshot.status === 'idle' ? 'NITROWAVE' : snapshot.title}</h1><p>{statusLine}</p>
            {(!inSystem || (media && media.duration > 0)) && <><input type="range" min="0" max={duration} step="0.1" value={Math.min(snapshot.currentTime, duration)} disabled={transportDisabled || inSystem} onChange={(event) => player.seek(Number(event.target.value))} aria-label="Playback position" style={{ '--progress': `${Math.min(snapshot.currentTime / duration, 1) * 100}%` } as CSSProperties} />
            <div className="time-row"><span>{formatClock(snapshot.currentTime)}</span><span>{formatClock(snapshot.duration)}</span></div></>}
          </div>
        </div></div></div>
      </section>

      <button className="deck-arrow left" type="button" onClick={() => cycleShader(-1)} aria-label="Previous shader" title="Previous shader"><Icon name="left" /></button>
      <button className="deck-arrow right" type="button" onClick={() => cycleShader(1)} aria-label="Next shader" title="Next shader"><Icon name="right" /></button>
      <section className="control-deck" aria-label="Playback controls">
        <button className="transport-button small" type="button" disabled={transportDisabled} onClick={() => press('restart', () => player.seek(0))} aria-label="Restart" title="Restart"><Icon name="restart" /></button>
        <button className="transport-button medium" type="button" disabled={transportDisabled} onClick={() => press('previous', () => player.seek(Math.max(0, snapshot.currentTime - 10)))} aria-label={inSystem ? 'Previous track' : 'Back ten seconds'} title={inSystem ? 'Previous track' : 'Back ten seconds'}><Icon name="previous" /></button>
        <button className="transport-button main-play" type="button" disabled={transportDisabled} onClick={() => press('toggle', playing ? player.pause : player.play)} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} /></button>
        <button className="transport-button medium" type="button" disabled={transportDisabled} onClick={() => press('next', () => player.seek(Math.min(snapshot.duration, snapshot.currentTime + 10)))} aria-label={inSystem ? 'Next track' : 'Forward ten seconds'} title={inSystem ? 'Next track' : 'Forward ten seconds'}><Icon name="next" /></button>
        <button className={`transport-button small${repeat && !inSystem ? ' on' : ''}`} type="button" disabled={inSystem} onClick={() => setRepeat((value) => !value)} aria-label="Repeat" aria-pressed={repeat} title="Repeat"><Icon name="repeat" /></button>
      </section>

      <button className="mode-trigger" type="button" onClick={() => setPanel((open) => open === 'visual' || open === 'skin' ? null : 'visual')} aria-label="Choose visual style and skin" title="Visuals & skins">FX {String(preset + 1).padStart(2, '0')}</button>
      <label className="volume-slot" title={inSystem ? 'Volume is set in the app that is playing' : `Volume ${snapshot.volume}%`}>
        <input type="range" min="0" max="100" value={snapshot.volume} disabled={inSystem} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" style={{ '--volume': `${snapshot.volume}%` } as CSSProperties} />
      </label>
      <button className="resize-grip" type="button" aria-label="Change window size" title="Click to change size" onClick={() => void cycleWindowSize()}><span /></button>

      {panel && <div className="source-popover" role="dialog" aria-label="Nitrowave settings">
        <div className="panel-heading">
          {panel === 'music' ? <span className="panel-title">LOAD MUSIC</span> : <div className="panel-tabs" role="tablist">
            {(['visual', 'skin'] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={panel === tab} className={panel === tab ? 'selected' : ''} onClick={() => setPanel(tab)}>{tab.toUpperCase()}</button>)}
          </div>}
          <button type="button" className="panel-close" onClick={() => setPanel(null)} aria-label="Close panel">×</button>
        </div>

        {panel === 'music' && <>
          <div className="file-row first"><span>MUSIC FILE ON THIS COMPUTER</span><button type="button" onClick={() => fileRef.current?.click()}>CHOOSE FILE</button><input ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac" onChange={(event) => { void handleFile(event.target.files?.[0]); event.target.value = ''; }} /></div>
          <div className="file-row first"><span>{media ? `FOLLOWING ${appLabel(media.app)}` : 'SPOTIFY, BROWSER OR ANY APP'}</span><button type="button" disabled={!capabilities.systemAudio} className={inSystem && capabilities.systemAudio ? 'on' : ''} onClick={followSystem} aria-pressed={inSystem && capabilities.systemAudio}>{inSystem && capabilities.systemAudio ? '✓ FOLLOWING' : 'FOLLOW'}</button></div>
          {!capabilities.systemAudio && <small className="source-hint">{capabilities.platform === 'macos' ? 'This Mac preview plays local music files. Audio from other apps is not available yet.' : 'Choose a local music file for audio-reactive visuals.'}</small>}
          <form onSubmit={(event) => { event.preventDefault(); void openYouTube(); }}><label htmlFor="source-url">YOUTUBE LINK</label><div className="source-row"><input id="source-url" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Paste YouTube URL" spellCheck={false} maxLength={2048} /><button type="submit">OPEN</button></div><small className="source-hint">{capabilities.systemAudio ? 'Opens in your browser. Nitrowave shows the song and dances to it.' : 'Opens in your browser. Use a local music file for audio-reactive visuals.'}</small></form>
        </>}

        {panel === 'visual' && <>
          <div className="preset-heading"><span>SHADER STYLE</span><small>{levels.available ? `AUDIO ${Math.round(levels.level * 100)}%` : 'NO AUDIO SIGNAL'}</small></div>
          <div className="preset-grid">{SHADER_PRESETS.map((item, index) => <button type="button" key={item.name} className={preset === index ? 'selected' : ''} onClick={() => setPreset(index as ShaderPresetIndex)} aria-pressed={preset === index}><i style={{ '--sky': item.sky, '--ground': item.ground, '--glow': item.color } as CSSProperties} /><span className="preset-number">{String(index + 1).padStart(2, '0')}</span>{item.name}</button>)}</div>
        </>}

        {panel === 'skin' && <>
          <div className="preset-heading"><span>SHELL SKIN</span></div>
          <div className="skin-grid">{SKINS.map((item) => <button type="button" key={item.id} className={skinId === item.id ? 'selected' : ''} onClick={() => setSkinId(item.id)} aria-pressed={skinId === item.id} title={item.description ?? item.name}>
            <i style={{ background: `linear-gradient(135deg, ${item.vars['--panel']} 0 45%, ${item.vars['--body']} 45% 80%, ${item.accent} 80%)` }} />{item.name}</button>)}</div>
          <p className="skin-description">{skin.description ?? `${skin.name} shell palette`}</p>
          <div className="preset-heading"><span>GLOW COLOUR</span></div>
          <div className="accent-row">
            {([['skin', 'SKIN'], ['shader', 'SHADER'], ['custom', 'CUSTOM']] as const).map(([mode, label]) => <button key={mode} type="button" className={accentMode === mode ? 'selected' : ''} onClick={() => setAccentMode(mode)} aria-pressed={accentMode === mode}>{label}</button>)}
            <input type="color" value={customAccent} onChange={(event) => { setCustomAccent(event.target.value); setAccentMode('custom'); }} aria-label="Custom glow colour" />
          </div>
        </>}

        {(externalError || snapshot.error) && <p className="source-error" role="alert">{externalError || snapshot.error}</p>}
      </div>}
    </div>
  </main>;
}

export default App;
