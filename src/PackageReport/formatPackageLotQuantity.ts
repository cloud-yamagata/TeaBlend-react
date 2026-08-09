/** Kg 数量表示（小数2桁まで・浮動小数点誤差を丸め） */
export function formatPackageLotQuantity(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function calcPackageLotUseQuantity(outQuantity: string, remQuantity: string): string {
  const out = Number(outQuantity.trim());
  if (!Number.isFinite(out)) return "";
  const rem = Number(remQuantity.trim());
  const remVal = Number.isFinite(rem) ? rem : 0;
  return formatPackageLotQuantity(out - remVal);
}
