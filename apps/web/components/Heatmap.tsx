const GRID_W = 24;
const GRID_H = 16;

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
  // Suavização (box blur 3x3) para as manchas não ficarem em blocos duros
  const blurred = new Float64Array(GRID_W * GRID_H);
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ];
  const kernelSum = 16;
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      let acc = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
            acc += counts[ny * GRID_W + nx] * kernel[ky + 1][kx + 1];
          }
        }
      }
      blurred[y * GRID_W + x] = acc / kernelSum;
    }
  }
  return { blurred, cellW, cellH };
}

export function Heatmap({ points }: { points: { x: number; y: number }[] }) {
  const W = 300;
  const H = 200;
  const { blurred, cellW, cellH } = buildGrid(points, W, H);
  const max = Math.max(...Array.from(blurred), 0.0001);

  const cells = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const v = blurred[y * GRID_W + x] / max;
      if (v < 0.04) continue;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x * cellW}
          y={y * cellH}
          width={cellW + 0.5}
          height={cellH + 0.5}
          fill={heatColor(v)}
          opacity={0.18 + v * 0.62}
        />,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 420, display: "block" }}>
      <rect x={0} y={0} width={W} height={H} fill="#F5F8FA" stroke="#C9D4DD" />
      {cells}
      <g fill="none" stroke="#0D1B2A" strokeOpacity={0.35}>
        <rect x={2} y={2} width={W - 4} height={H - 4} />
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} />
        <circle cx={W / 2} cy={H / 2} r={22} />
        <rect x={2} y={H / 2 - 36} width={30} height={72} />
        <rect x={W - 32} y={H / 2 - 36} width={30} height={72} />
      </g>
      <text x={4} y={H - 6} fontSize={9} fill="#5F7387">
        gol próprio
      </text>
      <text x={W - 4} y={12} fontSize={9} fill="#5F7387" textAnchor="end">
        gol adversário
      </text>
    </svg>
  );
}
