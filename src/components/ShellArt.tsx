import { memo, useId, type ReactNode } from 'react';
import { SkinFinish } from './SkinFinish';
import type { Skin } from '../skins/skins';
import { archShape, archTopEdge } from './titleArch';
import { BODY, POD, WING, CROWN, DECK, SIDE_SLOT, SHOULDER_SLOT, FOOT_SLOT, MIRROR } from './shellGeometry';

// Sculpted shell drawn in a 1000 × 1100 space (the device's 1 : 1.1 aspect). The orb sits at (500, 470).
// The cream panels are fused ("welded") with a goo filter, and one shared height map lights every surface,
// so the parts read as a single moulded object instead of stacked pieces.
const ARCH_BAND = archShape(), ARCH_GLASS = archShape(4), ARCH_GLINT = archTopEdge(7, -21, 21);
const POD_WELL = 'translate(112 566) scale(.8 .88) translate(-112 -566)';
const GRILLE = 'translate(112 566) scale(.68 .8) translate(-112 -566)';

const stop = (offset: string, color: string, opacity = 1) => <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />;
const both = (render: (transform?: string) => ReactNode) => <>{render()}{render(MIRROR)}</>;

const panelParts = <>
  {both((t) => <path d={WING} transform={t} />)}
  <path d={CROWN} />
  <path d={DECK} />
  <circle cx="500" cy="470" r="330" />
</>;

const slots = <>
  {both((t) => <g transform={t}><path d={SIDE_SLOT} /><path d={SHOULDER_SLOT} /><path d={FOOT_SLOT} /></g>)}
</>;

export const ShellArt = memo(function ShellArt({ finish }: { finish?: Skin['finish'] }) {
  const prefix = useId().replace(/:/g, '');
  const ref = (name: string) => `url(#${prefix}-${name})`;
  return <svg className="shell-art" viewBox="0 0 1000 1100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-body`} x1="0.1" y1="0" x2="0.9" y2="1">{stop('0', 'var(--body-hi)')}{stop('.34', 'var(--body)')}{stop('.72', 'var(--body)')}{stop('1', 'var(--body-lo)')}</linearGradient>
      <linearGradient id={`${prefix}-panel`} x1="0" y1="0" x2=".3" y2="1">{stop('0', 'var(--panel-hi)')}{stop('.5', 'var(--panel)')}{stop('1', 'var(--panel-lo)')}</linearGradient>
      <linearGradient id={`${prefix}-pod`} x1="0" y1="0" x2="1" y2=".4">{stop('0', 'var(--pod-lo)')}{stop('.55', 'var(--pod)')}{stop('1', 'var(--pod-hi)')}</linearGradient>
      <linearGradient id={`${prefix}-glass`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">{stop('0', '#000', .85)}{stop('.55', '#000', .6)}{stop('1', '#fff', .12)}</linearGradient>
      <pattern id={`${prefix}-grille`} width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="7.5" cy="7.5" r="3.3" style={{ fill: 'var(--grille)' }} /></pattern>
      <filter id={`${prefix}-goo`} x="0" y="0" width="1000" height="1100" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="17" />
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8.5" />
      </filter>
      <mask id={`${prefix}-weld`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1100">
        <g fill="#fff" filter={ref("goo")}>{panelParts}</g>
      </mask>
      {/* Height map → light: the red channel becomes surface height, then diffuse shading and specular sheen. */}
      <filter id={`${prefix}-shade`} x="0" y="0" width="1000" height="1100" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="height" />
        <feGaussianBlur in="height" stdDeviation="15" result="soft" />
        <feDiffuseLighting in="soft" surfaceScale="13" diffuseConstant="1.2" lightingColor="#fff" result="lit"><feDistantLight azimuth="235" elevation="56" /></feDiffuseLighting>
        <feComposite in="lit" in2="SourceAlpha" operator="in" />
      </filter>
      <filter id={`${prefix}-sheen`} x="0" y="0" width="1000" height="1100" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="height" />
        <feGaussianBlur in="height" stdDeviation="13" result="soft" />
        <feSpecularLighting in="soft" surfaceScale="13" specularConstant=".75" specularExponent="16" lightingColor="#fff" result="spec"><feDistantLight azimuth="235" elevation="48" /></feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" />
      </filter>
      <g id={`${prefix}-height`}>
        <path d={BODY} fill="#7a7a7a" />
        {both((t) => <g transform={t}><path d={POD} fill="#9c9c9c" /><path d={POD} fill="#3a3a3a" transform={POD_WELL} /></g>)}
        <g fill="none" stroke="#2c2c2c" strokeWidth="24" strokeLinecap="round">{slots}</g>
        <g fill="#dcdcdc" filter={ref("goo")}>{panelParts}</g>
        <path d={ARCH_BAND} fill="#9a9a9a" />
        <circle cx="500" cy="470" r="318" fill="#303030" />
        <circle cx="500" cy="470" r="300" fill="#585858" />
      </g>
      <clipPath id={`${prefix}-finish-clip`}><path d={BODY} /></clipPath>
      {/* Finishes follow the same welded surface as the colour layer. Keep an
          inset at seams and reserve the hardware, including translucent buttons. */}
      <filter id={`${prefix}-finish-inset`}><feMorphology operator="erode" radius="5" /></filter>
      <filter id={`${prefix}-finish-margin`}><feMorphology operator="dilate" radius="6" /></filter>
      <g id={`${prefix}-finish-hardware`} fill="#000" stroke="#000" strokeWidth="10">
        <circle cx="500" cy="470" r="322" />
        <path d={ARCH_BAND} />
        {both((t) => <g transform={t}><path d={POD} /><g fill="none" strokeWidth="34" strokeLinecap="round"><path d={SIDE_SLOT} /><path d={SHOULDER_SLOT} /><path d={FOOT_SLOT} /></g></g>)}
        {[-1, 1].map((side) => <circle key={side} cx={500 + side * 230} cy="770" r="32" />)}
        <circle cx="500" cy="878" r="86" />
        {[[-1, 230.5, 72.8], [-1, 132, 98], [1, 132, 98], [1, 230.5, 72.8]].map(([side, offset, size]) =>
          finish === 'circuit' || finish === 'cassette'
            ? <rect key={`${side}-${offset}`} x={500 + side * offset - size / 2 - 4} y={878 - size / 2 - 4} width={size + 8} height={size + 8} rx={size * .22} />
            : <circle key={`${side}-${offset}`} cx={500 + side * offset} cy="878" r={size / 2 + 4} />)}
        <rect x="371" y="987" width="258" height="45" rx="23" />
        <rect x="271" y="981" width="108" height="36" rx="18" />
        <circle cx="675" cy="999" r="25" />
      </g>
      <mask id={`${prefix}-finish-panel`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1100" style={{ maskType: 'luminance' }}>
        <g filter={ref('finish-inset')}><rect width="1000" height="1100" fill="#fff" mask={ref('weld')} /></g>
        <use href={`#${prefix}-finish-hardware`} />
      </mask>
      <mask id={`${prefix}-finish-chassis`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1100" style={{ maskType: 'luminance' }}>
        <path d={BODY} fill="#fff" filter={ref('finish-inset')} />
        <g filter={ref('finish-margin')}><rect width="1000" height="1100" fill="#000" mask={ref('weld')} /></g>
        <use href={`#${prefix}-finish-hardware`} />
      </mask>
    </defs>

    {/* Colour layer */}
    <path d={BODY} fill={ref("body")} />
    {both((t) => <g key={t ?? 'l'} transform={t}>
      <path d={POD} fill={ref("body")} />
      <path d={POD} fill={ref("pod")} transform={POD_WELL} />
      <path d={POD} fill={ref("grille")} transform={GRILLE} />
    </g>)}
    <g fill="none" style={{ stroke: 'var(--cavity)' }} strokeWidth="24" strokeLinecap="round">{slots}</g>
    <rect width="1000" height="1100" fill={ref("panel")} mask={ref("weld")} />
    <circle cx="500" cy="470" r="318" style={{ fill: 'var(--cavity)' }} />
    <circle cx="500" cy="470" r="300" style={{ fill: 'var(--collar)' }} />
    <path d={ARCH_BAND} style={{ fill: 'var(--cavity)' }} />
    <path d={ARCH_GLASS} fill={ref("glass")} />

    <SkinFinish finish={finish} prefix={prefix} />

    {/* Light layers */}
    <use href={`#${prefix}-height`} filter={ref("shade")} style={{ mixBlendMode: 'multiply' }} />
    <use href={`#${prefix}-height`} filter={ref("sheen")} style={{ mixBlendMode: 'screen' }} opacity=".6" />
    <path d={BODY} fill="none" style={{ stroke: 'var(--body-edge)' }} strokeWidth="2.5" />
    <path d={ARCH_GLINT} fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="2" strokeLinecap="round" />
  </svg>;
});

// Accent light sitting in the slots. Kept in its own SVG so its per-frame opacity changes never repaint the lit shell.
export const ShellGlow = memo(function ShellGlow() {
  const prefix = useId().replace(/:/g, '');
  const ref = (name: string) => `url(#${prefix}-${name})`;
  return <svg className="shell-glow" viewBox="0 0 1000 1100" preserveAspectRatio="none" aria-hidden="true">
    <defs><filter id={`${prefix}-bloom`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter></defs>
    <g fill="none" strokeLinecap="round">
      <g filter={ref("bloom")} strokeWidth="22" opacity=".8">{slots}<circle cx="500" cy="470" r="309" strokeWidth="14" /></g>
      <g className="shell-glow-core" strokeWidth="5">{slots}<circle cx="500" cy="470" r="309" strokeWidth="3" /></g>
    </g>
  </svg>;
});
