import type { CSSProperties } from 'react';

// The title strip follows an arc of a circle centred below the orb, in ShellArt's 1000 × 1100 space.
// It is a lens rather than a plain stroke: `width` at the rounded ends, swelling mostly upwards
// (towards the crown, away from the orb) to `width + swellTop + swellBottom` at the middle.
export const ARCH = { cx: 500, cy: 700, r: 590, span: 27, width: 56, swellTop: 22, swellBottom: 7 };

const point = (degrees: number, radius = ARCH.r) => {
  const rad = (degrees * Math.PI) / 180;
  return { x: ARCH.cx + radius * Math.sin(rad), y: ARCH.cy - radius * Math.cos(rad) };
};
const xy = ({ x, y }: { x: number; y: number }) => `${x.toFixed(1)} ${y.toFixed(1)}`;

const start = point(-ARCH.span), end = point(ARCH.span);
/** Centre line of the strip; the title text and buttons sit on it. */
export const ARCH_PATH = `M${xy(start)}A${ARCH.r} ${ARCH.r} 0 0 1 ${xy(end)}`;

// 1 in the middle of the strip, easing to 0 at both ends.
const swell = (degrees: number) => Math.cos((degrees / ARCH.span) * (Math.PI / 2)) ** 2;
const STEPS = 48;
const angles = Array.from({ length: STEPS + 1 }, (_, i) => -ARCH.span + (2 * ARCH.span * i) / STEPS);
const outer = (degrees: number, inset: number) => ARCH.r + ARCH.width / 2 + ARCH.swellTop * swell(degrees) - inset;
const inner = (degrees: number, inset: number) => ARCH.r - ARCH.width / 2 - ARCH.swellBottom * swell(degrees) + inset;

/** Closed outline of the strip, shrunk by `inset` on every side. */
export function archShape(inset = 0): string {
  const cap = ARCH.width / 2 - inset;
  const top = angles.map((a) => xy(point(a, outer(a, inset))));
  const bottom = [...angles].reverse().map((a) => xy(point(a, inner(a, inset))));
  return `M${top[0]}L${top.slice(1).join('L')}A${cap} ${cap} 0 0 1 ${bottom[0]}L${bottom.slice(1).join('L')}A${cap} ${cap} 0 0 1 ${top[0]}Z`;
}

/** Open line tracing the top edge, `inset` below it, between `from` and `to` degrees. */
export function archTopEdge(inset: number, from = -ARCH.span, to = ARCH.span): string {
  const points = angles.filter((a) => a >= from && a <= to).map((a) => xy(point(a, outer(a, inset))));
  return `M${points[0]}L${points.slice(1).join('L')}`;
}

/** Places an HTML element centred on the arc at `degrees` from the top, rotated to follow the curve. */
export function onArch(degrees: number): CSSProperties {
  const { x, y } = point(degrees);
  return { left: `${x / 10}%`, top: `${y / 11}%`, transform: `translate(-50%, -50%) rotate(${degrees}deg)` };
}
