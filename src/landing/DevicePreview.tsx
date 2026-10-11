import { useEffect, useId, useState, type CSSProperties } from 'react';
import { ShellArt, ShellGlow } from '../components/ShellArt';
import { ShaderVisual } from '../components/ShaderVisual';
import { ARCH_PATH } from '../components/titleArch';
import type { Skin } from '../skins/skins';
import { SHADER_PRESETS, type ShaderPresetIndex } from '../components/shaderPresets';

const quiet = { bass: 0, mid: 0, treble: 0, level: 0, available: false };

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return reduced;
}

export function DevicePreview({ skin, live = false, preset = 0 }: { skin: Skin; live?: boolean; preset?: ShaderPresetIndex }) {
  const titleId = useId();
  const animated = !useReducedMotion();
  const style = { ...skin.vars, '--accent': skin.accent, '--on-accent': '#15212a', '--audio-level': '0.15' } as CSSProperties;
  return <div className="device-shell preview-device" data-skin={skin.id} data-finish={skin.finish} style={style} role="img" aria-label={`Nitrowave Aero in the ${skin.name.toLowerCase()} skin`}>
    <ShellArt finish={skin.finish} /><ShellGlow />
    <svg className="title-text" viewBox="0 0 1000 1100" aria-hidden="true">
      <path id={titleId} d={ARCH_PATH} fill="none" />
      <text dy="2"><textPath href={`#${titleId}`} startOffset="50%" textAnchor="middle">NITROWAVE <tspan className="aero">AERO</tspan></textPath></text>
    </svg>
    <div className="optical-bezel"><div className="bezel-metal"><div className="bezel-light"><div className="optical-window">
      {live ? <ShaderVisual preset={preset} levels={quiet} active frozen={!animated} /> : <div className="preview-scene" />}
      <div className="optical-vignette" />
      <div className="track-overlay"><h2>NITROWAVE</h2><p>{live ? SHADER_PRESETS[preset].name : skin.name}</p><div className="preview-progress" /><div className="time-row"><span>01:24</span><span>04:08</span></div></div>
    </div></div></div></div>
    <div className="control-deck" aria-hidden="true">
      {[['small', '↻'], ['medium', '≪'], ['main-play', '▶'], ['medium', '≫'], ['small', '↺']].map(([size, icon], i) => <span className={`transport-button ${size}`} key={i}>{icon}</span>)}
    </div>
    <span className="mode-trigger" aria-hidden="true">FX {String(preset + 1).padStart(2, '0')}</span>
    <div className="volume-slot preview-volume" aria-hidden="true"><span /></div>
    <span className="resize-grip" aria-hidden="true"><span /></span>
  </div>;
}
