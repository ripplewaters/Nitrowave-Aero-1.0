import type { ReactNode } from 'react';
import type { Skin } from '../skins/skins';
import { BODY, CROWN, DECK, MIRROR, WING } from './shellGeometry';

// Material surfaces drawn beneath the shell lighting and controls, in ShellArt's 1000 × 1100 space.
// `finish-panel` masks the welded panels and `finish-chassis` the outer body; both already exclude hardware.
// Everything here is static SVG: no animation loop or extra canvas.

const CX = 500, CY = 470;
const polar = (degrees: number, radius: number) => {
  const a = (degrees * Math.PI) / 180;
  return [CX + Math.cos(a) * radius, CY + Math.sin(a) * radius] as const;
};
const both = (render: () => ReactNode) => <>{render()}<g transform={MIRROR}>{render()}</g></>;
const range = (count: number) => Array.from({ length: count }, (_, i) => i);
const STAR = 'M0-1C.12-.12.12-.12 1 0C.12.12.12.12 0 1C-.12.12-.12.12-1 0C-.12-.12-.12-.12 0-1Z';

function Chrome({ url }: { url: (name: string) => string }) {
  return <>
    <g mask={url('finish-panel')}>
      {/* A sky-over-horizon environment reflection per moulded part is what makes polished metal read as chrome. */}
      {both(() => <path d={WING} fill={url('chrome-env')} opacity=".78" />)}
      <path d={CROWN} fill={url('chrome-env')} opacity=".7" />
      <path d={DECK} fill={url('chrome-env-deck')} opacity=".78" />
      {/* Spun-metal grain around the orb, with the two bright anisotropic streaks of a lathe finish. */}
      <g fill="none" strokeWidth="1.4">
        {range(95).map((i) => <circle key={i} cx={CX} cy={CY} r={334 + i * 4} stroke={i % 2 ? '#fff' : '#0b1824'} strokeOpacity={i % 3 ? .07 : .12} />)}
      </g>
      {[[-128, .55], [52, .4], [-38, .22], [142, .25]].map(([a, o]) => {
        const [x1, y1] = polar(a - 7, 760), [x2, y2] = polar(a + 7, 760);
        return <path key={a} d={`M${CX} ${CY}L${x1} ${y1}L${x2} ${y2}Z`} fill={url('chrome-streak')} opacity={o} />;
      })}
      {/* Engraved dial ticks around the orb, deeper every fourth. */}
      <g fill="none" strokeLinecap="round">
        {range(31).map((i) => {
          const a = i * 4 + 30, major = i % 5 === 0;
          const [x1, y1] = polar(a, 344), [x2, y2] = polar(a, major ? 372 : 358);
          return <g key={i}><line x1={x1} y1={y1 + 1.5} x2={x2} y2={y2 + 1.5} stroke="#fff" strokeOpacity=".7" strokeWidth={major ? 3 : 1.8} /><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0e2233" strokeOpacity=".75" strokeWidth={major ? 3 : 1.8} /></g>;
        })}
      </g>
      {/* Machined panel seams and hex screws. */}
      {both(() => <g>
        <path d="M118 300C150 250 200 214 262 200" fill="none" stroke="#0f2131" strokeOpacity=".5" strokeWidth="2.5" />
        <path d="M118 302C150 252 200 216 262 202" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" transform="translate(0 3)" />
        <Screw x={205} y={275} />
        <Screw x={208} y={705} />
        <Screw x={300} y={948} />
      </g>)}
      <path d="M330 962Q500 978 670 962" fill="none" stroke="#0f2131" strokeOpacity=".45" strokeWidth="2" />
    </g>
    <g mask={url('finish-chassis')}>
      <path d={BODY} fill={url('brushed')} />
      <path d={BODY} fill={url('chrome-env-body')} opacity=".55" />
      {/* Cooling grooves cut into the lower body. */}
      {both(() => <g fill="none" strokeLinecap="round">
        {range(6).map((i) => <g key={i}><path d={`M${54 + i * 2} ${780 + i * 22}h${34 - i * 2}`} stroke="#060d14" strokeOpacity=".7" strokeWidth="5" /><path d={`M${54 + i * 2} ${783 + i * 22}h${34 - i * 2}`} stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" /></g>)}
      </g>)}
    </g>
  </>;
}

// Plain mirror chrome: only the sky-over-horizon reflections that make polished metal read as
// chrome, with no engraving, grain, screws or label.
function Mirror({ url }: { url: (name: string) => string }) {
  return <>
    <g mask={url('finish-panel')}>
      {both(() => <path d={WING} fill={url('chrome-env')} opacity=".92" />)}
      <path d={CROWN} fill={url('chrome-env')} opacity=".88" />
      <path d={DECK} fill={url('chrome-env-deck')} opacity=".92" />
      {[[-128, .5], [52, .35]].map(([a, o]) => {
        const [x1, y1] = polar(a - 9, 760), [x2, y2] = polar(a + 9, 760);
        return <path key={a} d={`M${CX} ${CY}L${x1} ${y1}L${x2} ${y2}Z`} fill={url('chrome-streak')} opacity={o} />;
      })}
    </g>
    <g mask={url('finish-chassis')}>
      <path d={BODY} fill={url('chrome-env-body')} opacity=".85" />
    </g>
  </>;
}

function Screw({ x, y, slot = 'hex' }: { x: number; y: number; slot?: 'hex' | 'cross' }) {
  return <g transform={`translate(${x} ${y})`}>
    <circle r="15" fill="#0b1520" opacity=".35" transform="translate(1 2)" />
    <circle r="13" fill="url(#nw-screw)" stroke="#33465a" strokeWidth="1.5" />
    <circle r="13" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" strokeDasharray="20 62" transform="rotate(200)" />
    {slot === 'hex'
      ? <path d="M0-6.5 5.6-3.25V3.25L0 6.5-5.6 3.25V-3.25Z" fill="#1b2a38" />
      : <path d="M-7 0H7M0-7V7" stroke="#2a1c10" strokeWidth="3" strokeLinecap="round" />}
  </g>;
}

function Circuit({ url }: { url: (name: string) => string }) {
  // Traces leave the orb radially, then bend to the board grid, ending in a via. Mirrored for the right side.
  const traces: { d: string; via: readonly [number, number] }[] = [];
  const route = (a: number, i: number, dir: 'x' | 'y', sign: number) => {
    const [x0, y0] = polar(a, 336), [x1, y1] = polar(a, 362 + (i % 3) * 22);
    const run = 46 + ((i * 37) % 70);
    const [x2, y2] = dir === 'x' ? [x1 + sign * run, y1] : [x1, y1 + sign * run];
    const kink = 26 + (i % 2) * 18;
    const [x3, y3] = dir === 'x' ? [x2 + sign * kink, y2 + (i % 2 ? kink : -kink)] : [x2 + (i % 2 ? kink : -kink), y2 + sign * kink];
    traces.push({ d: `M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}L${x3} ${y3}`, via: [x3, y3] });
  };
  range(12).forEach((i) => route(196 + i * 4.6, i, 'x', -1));
  range(11).forEach((i) => route(122 + i * 4.4, i, 'y', 1));
  range(8).forEach((i) => route(150 + i * 4, i, 'x', -1));
  const smd = [[172, 690, 90, 'R12'], [230, 655, 0, 'C4'], [292, 248, -35, 'R3'], [128, 318, -60, 'C9']] as const;
  return <>
    <g mask={url('finish-panel')}>
      <rect width="1000" height="1100" fill={url('pcb-grid')} />
      {both(() => <g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {traces.map((t, i) => <path key={i} d={t.d} stroke="#1a110a" strokeOpacity=".55" strokeWidth="6" transform="translate(1 2)" />)}
          {traces.map((t, i) => <path key={i} d={t.d} stroke={url('copper')} strokeWidth="4.2" />)}
          {traces.map((t, i) => <path key={i} d={t.d} stroke="#fff3c4" strokeOpacity=".45" strokeWidth="1" transform="translate(-.6 -.8)" />)}
        </g>
        {traces.map((t, i) => <g key={i} transform={`translate(${t.via[0]} ${t.via[1]})`}><circle r="7" fill="#d8b25a" stroke="#6d4f1c" strokeWidth="1.2" /><circle r="2.8" fill="#04120b" /></g>)}
        {/* Silkscreened SMD parts with tinned end caps. */}
        {smd.map(([x, y, rot, label]) => <g key={label} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <rect x="-16" y="-8" width="32" height="16" rx="2" fill="none" stroke="#e8f5df" strokeOpacity=".7" strokeWidth="1.2" />
          <rect x="-11" y="-5" width="22" height="10" fill="#151a17" /><rect x="-13" y="-5" width="5" height="10" fill="#d9dfe1" /><rect x="8" y="-5" width="5" height="10" fill="#d9dfe1" />
          <text y="-12" textAnchor="middle" fontFamily="Consolas, monospace" fontSize="10" fill="#e8f5df" fillOpacity=".8">{label}</text>
        </g>)}
        {/* Main chip on the shoulder: a QFP with gull-wing pins. */}
        <g transform="translate(212 268) rotate(-28)">
          <rect x="-34" y="-34" width="68" height="68" fill="none" stroke="#e8f5df" strokeOpacity=".6" strokeWidth="1.2" />
          {range(7).map((i) => <g key={i} fill="#d6dadc">{[0, 90, 180, 270].map((r) => <rect key={r} x={-21 + i * 6.4} y="-33" width="3.2" height="8" transform={`rotate(${r})`} />)}</g>)}
          <rect x="-25" y="-25" width="50" height="50" rx="2" fill="#141716" stroke="#000" />
          <rect x="-25" y="-25" width="50" height="50" rx="2" fill="none" stroke="#fff" strokeOpacity=".12" />
          <circle cx="-17" cy="-17" r="3" fill="#2d322f" />
          <text y="3" textAnchor="middle" fontFamily="Consolas, monospace" fontSize="9" fill="#9fb0a6">NW-01</text>
          <text y="13" textAnchor="middle" fontFamily="Consolas, monospace" fontSize="6.5" fill="#6f8077">0427 DSP</text>
        </g>
        {/* Status LED in the glow colour. */}
        <g transform="translate(206 800)">
          <circle r="16" style={{ fill: 'var(--accent)' }} opacity=".25" filter={url('led-bloom')} />
          <rect x="-7" y="-5" width="14" height="10" rx="2" style={{ fill: 'var(--accent)' }} />
          <rect x="-5" y="-3.5" width="6" height="3" rx="1" fill="#fff" opacity=".8" />
          <text y="22" textAnchor="middle" fontFamily="Consolas, monospace" fontSize="10" fill="#e8f5df" fillOpacity=".8">D1</text>
        </g>
      </g>)}
      {/* Gold edge-connector fingers along the deck's lower lip. */}
      <g>{range(26).map((i) => <rect key={i} x={377 + i * 9.4} y="944" width="6" height="22" rx="1.5" fill={url('gold-finger')} stroke="#6d4f1c" strokeWidth=".6" />)}</g>
    </g>
    <g mask={url('finish-chassis')}>
      <rect width="1000" height="1100" fill={url('pcb-grid')} opacity=".8" />
      {both(() => <g>
        <g fill="none" stroke={url('copper')} strokeWidth="3.4" strokeLinejoin="round" opacity=".85">
          {range(4).map((i) => <path key={i} d={`M${40 + i * 11} 330V${380 + i * 6}M${42 + i * 11} 760V${820 + i * 12}L${84 + i * 11} ${870 + i * 12}`} />)}
        </g>
        <g transform="translate(66 290)"><circle r="14" fill="#d8b25a" stroke="#6d4f1c" /><circle r="8" fill="#010805" /></g>
      </g>)}
    </g>
  </>;
}

function Peony({ x, y, scale = 1, rotate = 0 }: { x: number; y: number; scale?: number; rotate?: number }) {
  const petal = 'M0 0C-17-14-19-44 0-56C19-44 17-14 0 0Z';
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} strokeLinejoin="round">
    {[-58, 0, 58].map((r) => <g key={r} transform={`rotate(${r + 180})`}>
      <path d="M0 40C-20 58-22 88 0 108C22 88 20 58 0 40Z" fill="#2c57a8" fillOpacity=".55" stroke="#183a85" strokeWidth="2.2" />
      <path d="M0 46V102" stroke="#183a85" strokeWidth="1.6" />
    </g>)}
    {range(8).map((i) => <path key={i} d={petal} transform={`rotate(${i * 45 + 22})`} fill="#3d68b8" fillOpacity=".35" stroke="#183a85" strokeWidth="2.4" />)}
    {range(6).map((i) => <path key={i} d={petal} transform={`rotate(${i * 60}) scale(.62)`} fill="#244d9c" fillOpacity=".6" stroke="#122f73" strokeWidth="3" />)}
    <circle r="11" fill="#fdfbf3" stroke="#183a85" strokeWidth="2.4" />
    {range(8).map((i) => <circle key={i} r="2.2" fill="#183a85" transform={`rotate(${i * 45}) translate(0 -6)`} />)}
  </g>;
}

function Porcelain({ url }: { url: (name: string) => string }) {
  const vine = 'M-60 0C-40-22-20-22 0 0S40 22 60 0';
  return <>
    <g mask={url('finish-panel')}>
      {/* Faint crazing in the glaze. */}
      <rect width="1000" height="1100" fill={url('crackle')} opacity=".55" />
      {/* Cobalt rim band with a gold line inside it, traced from the welded panel outline. */}
      <rect width="1000" height="1100" fill="#1e3f8c" mask={url('porcelain-rim')} opacity=".9" />
      <rect width="1000" height="1100" fill="#c09a4e" mask={url('porcelain-gold')} />
      {both(() => <g>
        <Peony x={208} y={268} scale={.78} rotate={-30} />
        {/* Leafy tendrils trailing from the shoulder flower. */}
        <g fill="none" stroke="#183a85" strokeWidth="2" strokeLinecap="round">
          <path d="M262 226C286 206 312 202 336 208M300 205C304 192 316 186 326 188" />
          <path d="M150 330C138 352 136 376 146 396" />
        </g>
        <path d="M318 196C326 184 342 182 346 194C336 202 324 202 318 196Z" fill="#2c57a8" fillOpacity=".6" stroke="#183a85" strokeWidth="1.6" />
        {/* A spray of small blossoms on the deck lobe. */}
        <path d="M220 640C206 690 200 760 214 846" fill="none" stroke="#183a85" strokeWidth="2.2" strokeLinecap="round" />
        {[[222, 668, .3], [204, 742, .26], [212, 832, .32]].map(([x, y, s]) => <Peony key={y} x={x} y={y} scale={s} rotate={y} />)}
        {[[206, 705, -50], [228, 788, 40]].map(([x, y, r]) => <path key={y} d="M0 0C10-12 28-12 34 0C24 10 10 10 0 0Z" transform={`translate(${x} ${y}) rotate(${r})`} fill="#2c57a8" fillOpacity=".55" stroke="#183a85" strokeWidth="1.6" />)}
      </g>)}
      {/* Scrolling vine border along the lower lip. */}
      <g fill="none" stroke="#183a85" strokeWidth="2.2" transform="translate(500 948)">
        {range(5).map((i) => <g key={i} transform={`translate(${(i - 2) * 120} 0)`}>
          <path d={vine} />
          <path d="M-30-16C-34-28-24-34-18-28M30 16C34 28 24 34 18 28" />
          <circle cx="0" cy="0" r="4.5" fill="#183a85" />
        </g>)}
      </g>
      {/* Kintsugi: one deliberate gold repair across the right shoulder. */}
      <g transform={MIRROR}>
        <path d="M128 318 150 296 146 276 170 258 166 236 192 216" fill="none" stroke="#7d5a1f" strokeWidth="5" strokeLinejoin="round" opacity=".5" transform="translate(1 2)" />
        <path d="M128 318 150 296 146 276 170 258 166 236 192 216" fill="none" stroke={url('kintsugi')} strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M150 296 166 302M170 258 182 268" fill="none" stroke={url('kintsugi')} strokeWidth="1.8" />
      </g>
      {/* Wet glaze highlights. */}
      {both(() => <ellipse cx="236" cy="226" rx="70" ry="18" transform="rotate(-24 236 226)" fill={url('glaze')} />)}
    </g>
    <g mask={url('finish-chassis')}>
      <rect width="1000" height="1100" fill={url('crackle')} opacity=".35" />
      {/* Cobalt underglaze lines following the chassis rim. */}
      <path d={BODY} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" transform="translate(500 550) scale(.975) translate(-500 -550)" />
      <path d={BODY} fill="none" stroke="#c09a4e" strokeWidth="1.6" transform="translate(500 550) scale(.962) translate(-500 -550)" />
    </g>
  </>;
}

function Reel({ x, y, wound, rotate }: { x: number; y: number; wound: number; rotate: number }) {
  return <g transform={`translate(${x} ${y})`}>
    {/* Smoked window, then the wound tape pack, then the white hub. */}
    <circle r="64" fill="#140b05" opacity=".85" />
    <circle r="64" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="4" />
    <circle r={wound} fill="#3a2414" />
    {range(Math.floor((wound - 26) / 3)).map((i) => <circle key={i} r={27 + i * 3} fill="none" stroke={i % 2 ? '#5a3a20' : '#2b1a0e'} strokeWidth="1.2" opacity=".8" />)}
    <circle r={wound} fill="none" stroke="#7a5532" strokeWidth="1.5" />
    <g transform={`rotate(${rotate})`}>
      <circle r="25" fill="#f4ecdc" stroke="#9c8b70" strokeWidth="1.5" />
      {[0, 120, 240].map((a) => <path key={a} d="M-5-24L-3.5-13H3.5L5-24Z" fill="#d7cbb3" transform={`rotate(${a})`} />)}
      <circle r="12" fill="#1a110a" />
      {range(6).map((i) => <rect key={i} x="-2.2" y="-12" width="4.4" height="5" fill="#f4ecdc" transform={`rotate(${i * 60})`} />)}
    </g>
    {/* Glare across the window. */}
    <path d="M-52-28A60 60 0 0 1 22-58L28-46A48 48 0 0 0-40-20Z" fill="#fff" opacity=".22" />
    <circle r="64" fill="none" stroke="#ffe0a6" strokeOpacity=".35" strokeWidth="1.5" />
  </g>;
}

function Cassette({ url }: { url: (name: string) => string }) {
  return <>
    <g mask={url('finish-panel')}>
      {/* Paper label: ruled lines and a red margin rule. */}
      <rect width="1000" height="1100" fill={url('ruled')} opacity=".7" />
      {both(() => <path d="M160 640V960" stroke="#c4402c" strokeOpacity=".5" strokeWidth="2" />)}
      <Reel x={180} y={262} wound={58} rotate={12} />
      <Reel x={820} y={262} wound={36} rotate={-20} />
      <text x="212" y="738" fontFamily="'Arial Black', Impact, sans-serif" fontSize="50" fill="#3a2414" opacity=".85" textAnchor="middle">A</text>
      <text x="778" y="722" fontFamily="'Arial Black', Impact, sans-serif" fontSize="25" fill="#3a2414" opacity=".85" textAnchor="middle">C90</text>
      <text x="778" y="740" fontFamily="Consolas, monospace" fontSize="9" fill="#3a2414" opacity=".8" textAnchor="middle" letterSpacing="1.5">HIGH BIAS</text>
      {/* Seventies stripes wrapping the lower label. */}
      <g>
        {['#4a2a14', '#b2391f', '#e3701f', '#f2b532'].map((color, i) => <path key={color} d={`M0 ${930 + i * 11}H1000`} stroke={color} strokeWidth="11" />)}
      </g>
      {both(() => <g>
        {['#4a2a14', '#b2391f', '#e3701f', '#f2b532'].map((color, i) => <path key={color} d={`M${150 + i * 11} 640V900`} stroke={color} strokeWidth="11" opacity=".9" />)}
      </g>)}
    </g>
    <g mask={url('finish-chassis')}>
      {/* Smoked translucent shell: internal ribs and the tape guide show through. */}
      <path d={BODY} fill={url('smoke')} />
      {both(() => <g fill="none" stroke="#e7b36a" strokeOpacity=".22" strokeWidth="3">
        <path d="M60 340C46 420 40 520 44 600" /><circle cx="70" cy="840" r="18" /><circle cx="70" cy="840" r="7" /><path d="M86 850C140 900 200 960 300 1020" strokeDasharray="2 7" />
      </g>)}
      <Screw x={62} y={345} slot="cross" />
      <Screw x={938} y={345} slot="cross" />
      <Screw x={500} y={33} slot="cross" />
    </g>
  </>;
}

function Hologram({ url }: { url: (name: string) => string }) {
  // A compact-disc rainbow: hue follows twice the angle around the orb, like light split by fine grooves.
  const wedges = range(90).map((i) => {
    const a0 = i * 4, [x1, y1] = polar(a0 - .3, 900), [x2, y2] = polar(a0 + 4.3, 900);
    const hue = (a0 * 2 + 190) % 360;
    return <path key={i} d={`M${CX} ${CY}L${x1} ${y1}L${x2} ${y2}Z`} fill={`hsl(${hue} 100% 66%)`} />;
  });
  const sparkles = [[178, 236, 18], [312, 186, 9], [148, 330, 7], [206, 680, 14], [182, 860, 8], [262, 938, 10], [820, 230, 13], [700, 182, 7], [842, 330, 9], [796, 690, 9], [826, 856, 15], [744, 940, 8]];
  return <>
    <g mask={url('finish-panel')}>
      <g opacity=".85">{wedges}</g>
      <rect width="1000" height="1100" fill={url('holo-mist')} />
      <rect width="1000" height="1100" fill={url('diamond')} opacity=".9" />
      <rect width="1000" height="1100" fill={url('foil-lines')} opacity=".5" />
      {sparkles.map(([x, y, s]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
        <circle r={s * 1.4} fill={url('sparkle-glow')} />
        <path d={STAR} transform={`scale(${s})`} fill="#fff" />
        <path d={STAR} transform={`rotate(45) scale(${s * .45})`} fill="#fff" opacity=".8" />
      </g>)}
    </g>
    <g mask={url('finish-chassis')}>
      <g opacity=".42" style={{ mixBlendMode: 'screen' }}>{wedges}</g>
      <rect width="1000" height="1100" fill={url('diamond')} opacity=".45" />
    </g>
  </>;
}

const LABELS: Partial<Record<NonNullable<Skin['finish']>, string>> = {
  chrome: 'CHROME / MACHINED SERIES',
  circuit: 'PCB 01 / SIGNAL PATH',
  porcelain: 'Cobalt collection',
  cassette: 'summer mix  ’04',
  hologram: 'OPAL ✦ SPECTRAL EDITION',
};

export function SkinFinish({ finish, prefix }: { finish: Skin['finish']; prefix: string }) {
  if (!finish) return null;
  const url = (name: string) => `url(#${prefix}-${name})`;
  const id = (name: string) => `${prefix}-${name}`;
  return <g className={`skin-finish finish-${finish}`} clipPath={url('finish-clip')}>
    <defs>
      {/* Chrome */}
      <linearGradient id={id('chrome-env')} x1="0" y1="0" x2=".25" y2="1">
        <stop offset="0" stopColor="#ffffff" /><stop offset=".3" stopColor="#d7e6f3" /><stop offset=".47" stopColor="#8aa0b4" />
        <stop offset=".5" stopColor="#1d2b39" /><stop offset=".58" stopColor="#4a5d6f" /><stop offset=".8" stopColor="#c3d3e0" /><stop offset="1" stopColor="#f6fbff" />
      </linearGradient>
      <linearGradient id={id('chrome-env-deck')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2f8ff" /><stop offset=".42" stopColor="#c9d8e5" /><stop offset=".56" stopColor="#7d93a7" />
        <stop offset=".6" stopColor="#1b2936" /><stop offset=".7" stopColor="#56697a" /><stop offset="1" stopColor="#e4eef7" />
      </linearGradient>
      <linearGradient id={id('chrome-env-body')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" /><stop offset=".22" stopColor="#9db2c4" /><stop offset=".3" stopColor="#0d1822" />
        <stop offset=".5" stopColor="#4c6276" /><stop offset=".7" stopColor="#c6d6e3" /><stop offset=".86" stopColor="#21303e" /><stop offset="1" stopColor="#8aa0b2" />
      </linearGradient>
      <radialGradient id={id('chrome-streak')} cx={CX} cy={CY} r="600" gradientUnits="userSpaceOnUse">
        <stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset=".62" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <pattern id={id('brushed')} width="7" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 1H7M0 5H4" stroke="#fff" strokeOpacity=".22" strokeWidth=".7" />
        <path d="M1 3H7M0 7.5H5" stroke="#07131f" strokeOpacity=".22" strokeWidth=".6" />
      </pattern>
      <radialGradient id="nw-screw" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#a9b9c7" /><stop offset="1" stopColor="#4e6070" /></radialGradient>
      {/* Circuit */}
      <pattern id={id('pcb-grid')} width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M0 .5H22M.5 0V22" stroke="#9cf5b5" strokeOpacity=".07" />
        <circle cx="11" cy="11" r="1.4" fill="#000" fillOpacity=".25" />
      </pattern>
      <linearGradient id={id('copper')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6d585" /><stop offset=".5" stopColor="#c99a43" /><stop offset="1" stopColor="#e8c06a" />
      </linearGradient>
      <linearGradient id={id('gold-finger')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a87d2c" /><stop offset=".4" stopColor="#ffe9a6" /><stop offset="1" stopColor="#b88d38" />
      </linearGradient>
      <filter id={id('led-bloom')} x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="5" /></filter>
      {/* Porcelain */}
      <pattern id={id('crackle')} width="120" height="96" patternUnits="userSpaceOnUse">
        <path d="M0 30 24 26 40 44 66 38 86 52 120 46M24 26 30 0M40 44 34 70 52 96M66 38 72 12 96 4M86 52 98 80 120 84M34 70 10 76 0 72" fill="none" stroke="#5f7396" strokeOpacity=".22" strokeWidth=".8" />
      </pattern>
      <linearGradient id={id('kintsugi')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3b8" /><stop offset=".5" stopColor="#d6a53c" /><stop offset="1" stopColor="#f6d77b" /></linearGradient>
      <radialGradient id={id('glaze')}><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      <filter id={id('rim-in-1')}><feMorphology operator="erode" radius="7" /></filter>
      <filter id={id('rim-in-2')}><feMorphology operator="erode" radius="16" /></filter>
      <filter id={id('rim-in-3')}><feMorphology operator="erode" radius="19" /></filter>
      <filter id={id('rim-in-4')}><feMorphology operator="erode" radius="21" /></filter>
      {finish === 'porcelain' && <>
        <mask id={id('porcelain-rim')} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1100">
          <g filter={url('rim-in-1')}><rect width="1000" height="1100" fill="#fff" mask={url('weld')} /></g>
          <g filter={url('rim-in-2')}><rect width="1000" height="1100" fill="#000" mask={url('weld')} /></g>
        </mask>
        <mask id={id('porcelain-gold')} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1100">
          <g filter={url('rim-in-3')}><rect width="1000" height="1100" fill="#fff" mask={url('weld')} /></g>
          <g filter={url('rim-in-4')}><rect width="1000" height="1100" fill="#000" mask={url('weld')} /></g>
        </mask>
      </>}
      {/* Cassette */}
      <pattern id={id('ruled')} width="1000" height="20" patternUnits="userSpaceOnUse"><path d="M0 19.5H1000" stroke="#6f8bb0" strokeOpacity=".45" /></pattern>
      <radialGradient id={id('smoke')} cx=".5" cy=".4" r=".7">
        <stop offset="0" stopColor="#ffb24d" stopOpacity=".18" /><stop offset=".7" stopColor="#4a2408" stopOpacity=".1" /><stop offset="1" stopColor="#000" stopOpacity=".35" />
      </radialGradient>
      {/* Hologram */}
      <linearGradient id={id('holo-mist')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".35" stopColor="#fff" stopOpacity=".1" />
        <stop offset=".55" stopColor="#fff" stopOpacity=".45" /><stop offset=".8" stopColor="#fff" stopOpacity=".05" /><stop offset="1" stopColor="#fff" stopOpacity=".35" />
      </linearGradient>
      <pattern id={id('diamond')} width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M18 0 36 18 18 36 0 18Z" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
        <path d="M18 3 33 18 18 33" fill="none" stroke="#3b2d6b" strokeOpacity=".22" />
        <circle cx="18" cy="18" r="1.3" fill="#fff" opacity=".7" />
      </pattern>
      <pattern id={id('foil-lines')} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
        <path d="M0 1H9" stroke="#ff9ff3" strokeOpacity=".35" /><path d="M0 4H9" stroke="#8ff5ff" strokeOpacity=".35" /><path d="M0 7H9" stroke="#fff59a" strokeOpacity=".3" />
      </pattern>
      <radialGradient id={id('sparkle-glow')}><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".4" stopColor="#ffd6ff" stopOpacity=".35" /><stop offset="1" stopColor="#bdf6ff" stopOpacity="0" /></radialGradient>
    </defs>
    {finish === 'chrome' && <Chrome url={url} />}
    {finish === 'mirror' && <Mirror url={url} />}
    {finish === 'circuit' && <Circuit url={url} />}
    {finish === 'porcelain' && <Porcelain url={url} />}
    {finish === 'cassette' && <Cassette url={url} />}
    {finish === 'hologram' && <Hologram url={url} />}
    {LABELS[finish] && <g mask={url('finish-chassis')}>
      <text x="500" y="1056" textAnchor="middle" fill={finish === 'cassette' ? '#ffdf9e' : 'var(--ink)'}
        fontFamily={finish === 'porcelain' ? 'Georgia, serif' : finish === 'cassette' ? "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" : 'Consolas, monospace'}
        fontSize={finish === 'cassette' ? 19 : 12} letterSpacing={finish === 'cassette' ? 0 : 2} fontStyle={finish === 'porcelain' ? 'italic' : undefined}>
        {LABELS[finish]}
      </text>
    </g>}
  </g>;
}
