/**
 * Pequena marca geométrica de cada fragmento: n pontos distribuídos sobre
 * uma circunferência, ligados por uma linha fina. Muda conforme o número.
 */
export function FragmentMark({ n, size = 44, active = false }: { n: number; size?: number; active?: boolean }) {
  const r = 15;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [22 + Math.cos(a) * r, 22 + Math.sin(a) * r] as const;
  });
  // Liga os pontos pulando um passo que depende de n — cada número gera um desenho próprio.
  const stepBy = n > 4 ? Math.max(2, Math.floor(n / 2) - (n % 2 === 0 ? 1 : 0)) : 1;
  const order: number[] = [];
  let idx = 0;
  const seen = new Set<number>();
  for (let k = 0; k < n; k++) {
    if (seen.has(idx)) idx = (idx + 1) % n;
    order.push(idx);
    seen.add(idx);
    idx = (idx + stepBy) % n;
  }
  const d =
    n > 1
      ? order.map((i, k) => `${k ? 'L' : 'M'}${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`).join(' ') + ' Z'
      : '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="fragment-mark"
    >
      <circle cx="22" cy="22" r={r} strokeWidth="0.6" opacity="0.35" />
      {d && <path d={d} strokeWidth="0.75" opacity={active ? 1 : 0.7} />}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}
