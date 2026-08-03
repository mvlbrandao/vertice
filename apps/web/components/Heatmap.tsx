export function Heatmap({ points }: { points: { x: number; y: number }[] }) {
  const W = 300;
  const H = 200;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 360, display: "block" }}>
      <rect x={0} y={0} width={W} height={H} fill="#12855A" fillOpacity={0.12} stroke="#12855A" strokeOpacity={0.5} />
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#12855A" strokeOpacity={0.35} />
      <circle cx={W / 2} cy={H / 2} r={22} fill="none" stroke="#12855A" strokeOpacity={0.35} />
      <text x={4} y={H - 6} fontSize={9} fill="#5F7387">
        gol próprio
      </text>
      <text x={W - 4} y={12} fontSize={9} fill="#5F7387" textAnchor="end">
        gol adversário
      </text>
      {points.map((p, i) => (
        <circle key={i} cx={(p.x / 100) * W} cy={H - (p.y / 100) * H} r={7} fill="#0B63CE" fillOpacity={0.16} />
      ))}
    </svg>
  );
}
