/** USA Pickleball court in feet. Top of diagrams = opponent baseline. */

export const COURT_FT = {
  width: 20,
  length: 44,
  kitchen: 7,
  /** Net height at center (inches). */
  netCenterIn: 34,
  /** Net height at sideline (inches). */
  netSidelineIn: 36,
} as const;

export const PAD_X = 2.5;
export const PAD_Y = 2.5;

export const COURT_VB_W = COURT_FT.width + PAD_X * 2;
export const COURT_VB_H = COURT_FT.length + PAD_Y * 2;

/** X in SVG units from the left sideline (ft). */
export function xFt(fromLeft: number) {
  return PAD_X + fromLeft;
}

/** Y in SVG units from the opponent baseline (ft). */
export function yFt(fromOppBaseline: number) {
  return PAD_Y + fromOppBaseline;
}

export const NET_Y = yFt(22);
export const NVZ_OPP_Y = yFt(22 - COURT_FT.kitchen);
export const NVZ_YOU_Y = yFt(22 + COURT_FT.kitchen);
export const MID_X = xFt(COURT_FT.width / 2);

export const POS = {
  oppLeft: { x: 5, y: 14.4 },
  oppRight: { x: 15, y: 14.4 },
  oppMid: { x: 10, y: 14.4 },
  youLeft: { x: 5, y: 29.6 },
  youRight: { x: 15, y: 29.6 },
  youMid: { x: 10, y: 29.6 },
  youBaseL: { x: 6, y: 41 },
  youBaseR: { x: 14, y: 41 },
  oppBaseL: { x: 6, y: 3 },
  oppBaseR: { x: 14, y: 3 },
} as const;
