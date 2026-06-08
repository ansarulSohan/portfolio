export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function cubicInOut(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

