import { useId, type CSSProperties } from 'react';
import { ShellArt, ShellGlow } from '../components/ShellArt';
import { ARCH_PATH } from '../components/titleArch';
import type { Skin } from '../skins/skins';
import { SHADER_PRESETS, type ShaderPresetIndex } from '../components/shaderPresets';

export function DevicePreview({ skin, featured = false, preset = 0 }: { skin: Skin; featured?: boolean; preset?: ShaderPresetIndex }) {
  const titleId = useId();
  const style = { ...skin.vars, '--accent': skin.accent, '--on-accent': '#15212a', '--audio-level': '0.15' } as CSSProperties;
  return <div className="device-shell preview-device" data-skin={skin.id} data-finish={skin.finish} style={style} role="img" aria-label={`Nitrowave Aero in the ${skin.name.toLowerCase()} skin`}>
    <ShellArt finish={skin.finish} /><ShellGlow />
    <svg className="title-text" viewBox="0 0 1000 1100" aria-hidden="true">
      <path id={titleId} d={ARCH_PATH} fill="none" />
      <text dy="2"><textPath href={`#${titleId}`} startOffset="50%" textAnchor="middle">NITROWAVE <tspan className="aero">AERO</tspan></textPath></text>
    </svg>
    <div className="optical-bezel"><div className="bezel-metal"><div className="bezel-light"><div className="optical-window">
      {featured ? <img className="preview-world" src={`./worlds/${String(preset + 1).padStart(2, '0')}.jpg`} width="480" height="480" decoding="async" alt="" /> : <div className="preview-scene" />}
      <div className="optical-vignette" />
      <div className="track-overlay"><h2>NITROWAVE</h2><p>{featured ? SHADER_PRESETS[preset].name : skin.name}</p><div className="preview-progress" /><div className="time-row"><span>01:24</span><span>04:08</span></div></div>
    </div></div></div></div>
    <div className="control-deck" aria-hidden="true">
      {[['small', '↻'], ['medium', '≪'], ['main-play', '▶'], ['medium', '≫'], ['small', '↺']].map(([size, icon], i) => <span className={`transport-button ${size}`} key={i}>{icon}</span>)}
    </div>
    <span className="mode-trigger" aria-hidden="true">FX {String(preset + 1).padStart(2, '0')}</span>
    <div className="volume-slot preview-volume" aria-hidden="true"><span /></div>
    <span className="resize-grip" aria-hidden="true"><span /></span>
  </div>;
}
