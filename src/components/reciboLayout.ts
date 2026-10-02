export const MM = 96 / 25.4;
export const SHEET_W = 215.9;
export const PAGE_H = 279.4;
export const HALF_H = 139.7;
export const PAD_X = 8;
export const PAD_Y = 6;
export const EPS = 1;

export type ModoHoja = "auto" | "media" | "entera" | "overflow";

export function decidirDisposicion(bodyH: number): ModoHoja {
  const mediaAvail = HALF_H - PAD_Y * 2 - EPS;
  const enteraAvail = PAGE_H - PAD_Y * 2 - EPS;
  if (bodyH <= mediaAvail) return "media";
  if (bodyH <= enteraAvail) return "entera";
  return "overflow";
}
