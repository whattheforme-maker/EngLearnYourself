import type { CSSProperties } from "react";

/** 3D tugma soyasi uchun CSS o'zgaruvchisini React uslubiga o'raydi. */
export function shadowVar(color: string): CSSProperties {
  return { "--btn-shadow": color } as CSSProperties;
}
