import type { Visual, Shape } from '../curriculum/types';

export function VisualView({ v }: { v: Visual }) {
  if (v.type === 'bar') return <BarVisual parts={v.parts} shaded={v.shaded} />;
  if (v.type === 'coords') return <Coords v={v} />;
  return <Figure shape={v.shape} labels={v.labels} />;
}

function BarVisual({ parts, shaded }: { parts: number; shaded: number }) {
  const w = 320, h = 56, pad = 2;
  const pw = (w - 2 * pad) / parts;
  return (
    <svg class="bar" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Streifen mit ${parts} Teilen, ${shaded} gefärbt`}>
      {Array.from({ length: parts }, (_, i) => (
        <rect key={i} x={pad + i * pw} y={pad} width={pw} height={h - 2 * pad} class={i < shaded ? 'on' : 'off'} />
      ))}
    </svg>
  );
}

function Coords({ v }: { v: Extract<Visual, { type: 'coords' }> }) {
  const r = v.r ?? 6;
  const S = 300, u = S / (2 * r + 1), c = S / 2;
  const X = (x: number) => c + x * u;
  const Y = (y: number) => c - y * u;
  const ticks = Array.from({ length: 2 * r + 1 }, (_, i) => i - r);
  return (
    <svg class="coords" viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Koordinatensystem">
      {ticks.map((t) => <line key={'v' + t} x1={X(t)} y1={0} x2={X(t)} y2={S} class="grid" />)}
      {ticks.map((t) => <line key={'h' + t} x1={0} y1={Y(t)} x2={S} y2={Y(t)} class="grid" />)}
      <line x1={0} y1={c} x2={S} y2={c} class="axis" />
      <line x1={c} y1={0} x2={c} y2={S} class="axis" />
      <text x={S - 10} y={c - 6} class="lbl">x</text>
      <text x={c + 6} y={12} class="lbl">y</text>
      {ticks.filter((t) => t !== 0 && t % 2 === 0).map((t) => (
        <g key={'t' + t}>
          <text x={X(t)} y={c + 13} class="tick" text-anchor="middle">{t}</text>
          <text x={c - 5} y={Y(t) + 4} class="tick" text-anchor="end">{t}</text>
        </g>
      ))}
      {(v.lines ?? []).map((l, i) => (
        <line key={'l' + i} x1={X(-r - 1)} y1={Y(l.m * (-r - 1) + l.q)} x2={X(r + 1)} y2={Y(l.m * (r + 1) + l.q)} class="fn" />
      ))}
      {(v.points ?? []).map((p) => (
        <g key={p.label}>
          <circle cx={X(p.x)} cy={Y(p.y)} r={4} class="pt" />
          <text x={X(p.x) + 6} y={Y(p.y) - 6} class="lbl">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Schematische Skizzen (nicht massstäblich). Beschriftungen per Schlüssel. */
function Figure({ shape, labels: L }: { shape: Shape; labels: Partial<Record<string, string>> }) {
  const t = (x: number, y: number, k: string, anchor = 'middle') =>
    L[k] ? <text x={x} y={y} class="lbl" text-anchor={anchor}>{L[k]}</text> : null;
  let body;
  switch (shape) {
    case 'rect':
      body = <><rect x={40} y={30} width={200} height={110} class="shape" />{t(140, 160, 'a')}{t(250, 90, 'b', 'start')}</>;
      break;
    case 'rtriangle':
      body = <><polygon points="40,150 240,150 40,30" class="shape" /><rect x={40} y={136} width={14} height={14} class="ra" />
        {t(140, 170, 'a')}{t(30, 95, 'b', 'end')}{t(150, 82, 'c', 'start')}</>;
      break;
    case 'triangle':
      body = <><polygon points="30,150 250,150 170,30" class="shape" /><line x1={170} y1={30} x2={170} y2={150} class="dash" />
        {t(140, 170, 'g')}{t(178, 100, 'h', 'start')}</>;
      break;
    case 'parallelogram':
      body = <><polygon points="40,150 210,150 260,40 90,40" class="shape" /><line x1={90} y1={40} x2={90} y2={150} class="dash" />
        {t(125, 170, 'g')}{t(98, 100, 'h', 'start')}</>;
      break;
    case 'trapez':
      body = <><polygon points="30,150 260,150 200,50 90,50" class="shape" /><line x1={90} y1={50} x2={90} y2={150} class="dash" />
        {t(145, 170, 'a')}{t(145, 40, 'c')}{t(98, 105, 'h', 'start')}</>;
      break;
    case 'circle':
      body = <><circle cx={140} cy={95} r={70} class="shape" /><line x1={140} y1={95} x2={210} y2={95} class="dash" /><circle cx={140} cy={95} r={3} class="pt" />
        {t(175, 88, 'r')}{t(140, 185, 'd')}</>;
      break;
    case 'cuboid':
    case 'prism':
      body = <><polygon points="40,150 190,150 190,70 40,70" class="shape" /><polygon points="40,70 90,30 240,30 190,70" class="shape light" /><polygon points="190,150 240,110 240,30 190,70" class="shape light" />
        {t(115, 170, 'a')}{t(225, 145, 'b', 'start')}{t(30, 115, 'c', 'end')}</>;
      break;
    case 'cylinder':
      body = <><ellipse cx={140} cy={40} rx={70} ry={18} class="shape light" /><path d="M70 40 V150 A70 18 0 0 0 210 150 V40" class="shape" /><line x1={140} y1={40} x2={210} y2={40} class="dash" />
        {t(175, 34, 'r')}{t(222, 100, 'h', 'start')}</>;
      break;
    case 'pyramid':
      body = <><polygon points="40,150 200,150 240,115 140,25" class="shape light" /><line x1={40} y1={150} x2={140} y2={25} class="shape" /><line x1={200} y1={150} x2={140} y2={25} class="shape" />
        <line x1={140} y1={25} x2={140} y2={132} class="dash" />{t(120, 170, 'a')}{t(148, 90, 'h', 'start')}</>;
      break;
    case 'cone':
      body = <><ellipse cx={140} cy={150} rx={80} ry={18} class="shape light" /><line x1={60} y1={150} x2={140} y2={25} class="shape" /><line x1={220} y1={150} x2={140} y2={25} class="shape" />
        <line x1={140} y1={25} x2={140} y2={150} class="dash" /><line x1={140} y1={150} x2={220} y2={150} class="dash" />{t(180, 170, 'r')}{t(148, 95, 'h', 'start')}</>;
      break;
    case 'sphere':
      body = <><circle cx={140} cy={95} r={70} class="shape" /><ellipse cx={140} cy={95} rx={70} ry={16} class="dash" /><line x1={140} y1={95} x2={210} y2={95} class="dash" />{t(175, 88, 'r')}</>;
      break;
  }
  return <svg class="figure" viewBox="-30 0 320 190" role="img" aria-label="Skizze, nicht massstäblich">{body}</svg>;
}
