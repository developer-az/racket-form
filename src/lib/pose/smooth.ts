/**
 * Savitzky–Golay smoothing — same class of filter TennisTracker uses on
 * noisy MediaPipe / detector tracks. Window 7, polynomial degree 2
 * preserves swing curvature better than a box average.
 */
const SG7 = [-2, 3, 6, 7, 6, 3, -2].map((c) => c / 21);

export function savitzkyGolay(values: number[], window = 7): number[] {
  const n = values.length;
  if (n < 3) return values.slice();
  const coeffs = window <= 5 ? [-3, 12, 17, 12, -3].map((c) => c / 35) : SG7;
  const half = Math.floor(coeffs.length / 2);
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    let w = 0;
    for (let k = -half; k <= half; k++) {
      const j = i + k;
      if (j < 0 || j >= n) continue;
      const c = coeffs[k + half];
      acc += values[j] * c;
      w += c;
    }
    out[i] = w === 0 ? values[i] : acc / w;
  }
  return out;
}

export function smoothSeries(values: number[]): number[] {
  return savitzkyGolay(values);
}
