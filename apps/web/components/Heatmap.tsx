const GRID_W = 40;
const GRID_H = 26;

// Paleta consistente com o resto do app: azul (frio) -> verde -> âmbar -> vermelho (quente)
const STOPS: [number, [number, number, number]][] = [
  [0, [11, 99, 206]], // --blue
  [0.4, [18, 133, 90]], // --pitch
  [0.7, [184, 102, 18]], // --amber
  [1, [179, 53, 44]], // --red
];

function heatColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i];
    const [t1, c1] = STOPS[i + 1];
    if (clamped >= t0 && clamped <= t1) {
      const f = t1 === t0 ? 0 : (clamped - t0) / (t1 - t0);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
      return `rgb(${r},${g},${b})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1].join(",")})`;
}

// Kernel 5x5 aproximando uma gaussiana (sigma~1) — um blur 3x3 simples deixava pontos
// isolados como uma manchinha em cruz "flutuando" solta, sem parecer calor de verdade.
const KERNEL = [
  [1, 4, 7, 4, 1],
  [4, 16, 26, 16, 4],
  [7, 26, 41, 26, 7],
  [4, 16, 26, 16, 4],
  [1, 4, 7, 4, 1],
];
const KERNEL_SUM = 273;

function buildGrid(points: { x: number; y: number }[], w: number, h: number) {
  const counts = new Float64Array(GRID_W * GRID_H);
  const cellW = w / GRID_W;
  const cellH = h / GRID_H;
  for (const p of points) {
    const px = (p.x / 100) * w;
    const py = h - (p.y / 100) * h;
    const ix = Math.min(GRID_W - 1, Math.max(0, Math.floor(px / cellW)));
    const iy = Math.min(GRID_H - 1, Math.max(0, Math.floor(py / cellH)));
    counts[iy * GRID_W + ix] += 1;
  }
  const blurred = new Float64Array(GRID_W * GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      let acc = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
            acc += counts[ny * GRID_W + nx] * KERNEL[ky + 2][kx + 2];
          }
        }
      }
      blurred[y * GRID_W + x] = acc / KERNEL_SUM;
    }
  }
  return { blurred, cellW, cellH };
}

function PitchMarkings({ w, h }: { w: number; h: number }) {
  const boxW = w * 0.16;
  const boxH = h * 0.62;
  const goalBoxW = w * 0.055;
  const goalBoxH = h * 0.28;
  const goalW = h * 0.11;
  const penaltySpotX = w * 0.115;
  const arc = w * 0.02;

  return (
    <g fill="none" stroke="#0D1B2A" strokeOpacity={0.38} strokeWidth={0.75}>
      <rect x={1} y={1} width={w - 2} height={h - 2} />
      <line x1={w / 2} y1={0} x2={w / 2} y2={h} />
      <circle cx={w / 2} cy={h / 2} r={h * 0.18} />
      <circle cx={w / 2} cy={h / 2} r={1} fill="#0D1B2A" fillOpacity={0.38} stroke="none" />

      {/* Grande área + pequena área + marca do pênalti — lado do gol próprio (esquerda) */}
      <rect x={1} y={h / 2 - boxH / 2} width={boxW} height={boxH} />
      <rect x={1} y={h / 2 - goalBoxH / 2} width={goalBoxW} height={goalBoxH} />
      <circle cx={penaltySpotX} cy={h / 2} r={1} fill="#0D1B2A" fillOpacity={0.38} stroke="none" />
      <rect x={-2.5} y={h / 2 - goalW / 2} width={2.5} height={goalW} strokeOpacity={0.55} />
      <path d={`M ${1 + arc} ${h / 2 - boxH / 2} A ${arc} ${arc} 0 0 1 ${1} ${h / 2 - boxH / 2 - arc}`} />
      <path d={`M ${1 + arc} ${h / 2 + boxH / 2} A ${arc} ${arc} 0 0 0 ${1} ${h / 2 + boxH / 2 + arc}`} />

      {/* Grande área + pequena área + marca do pênalti — lado do gol adversário (direita) */}
      <rect x={w - 1 - boxW} y={h / 2 - boxH / 2} width={boxW} height={boxH} />
      <rect x={w - 1 - goalBoxW} y={h / 2 - goalBoxH / 2} width={goalBoxW} height={goalBoxH} />
      <circle cx={w - penaltySpotX} cy={h / 2} r={1} fill="#0D1B2A" fillOpacity={0.38} stroke="none" />
      <rect x={w} y={h / 2 - goalW / 2} width={2.5} height={goalW} strokeOpacity={0.55} />
      <path d={`M ${w - 1 - arc} ${h / 2 - boxH / 2} A ${arc} ${arc} 0 0 0 ${w - 1} ${h / 2 - boxH / 2 - arc}`} />
      <path d={`M ${w - 1 - arc} ${h / 2 + boxH / 2} A ${arc} ${arc} 0 0 1 ${w - 1} ${h / 2 + boxH / 2 + arc}`} />
    </g>
  );
}

export function Heatmap({ points }: { points: { x: number; y: number }[] }) {
  const W = 300;
  const H = 200;
  const filterId = "sc-heat-blur";
  const { blurred, cellW, cellH } = buildGrid(points, W, H);
  const max = Math.max(...Array.from(blurred), 0.0001);

  const cells = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const v = blurred[y * GRID_W + x] / max;
      if (v < 0.05) continue;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x * cellW}
          y={y * cellH}
          width={cellW + 0.6}
          height={cellH + 0.6}
          fill={heatColor(v)}
          opacity={0.12 + v * 0.68}
        />,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 420, display: "block" }}>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#F5F8FA" />
      <g filter={`url(#${filterId})`}>{cells}</g>
      <PitchMarkings w={W} h={H} />
      <text x={4} y={H - 6} fontSize={9} fill="#5F7387">
        gol próprio
      </text>
      <text x={W - 4} y={12} fontSize={9} fill="#5F7387" textAnchor="end">
        gol adversário
      </text>
    </svg>
  );
}
