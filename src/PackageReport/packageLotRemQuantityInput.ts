import { calcPackageLotUseQuantity, formatPackageLotQuantity } from "./formatPackageLotQuantity";
import type { PackageLotDetailRowIndex } from "./applyFactory3StocToLotRow";
import type { PackageLotEditFormData } from "./packageLotEditTypes";

const REM_INPUT_PATTERN = /^\d*\.?\d{0,2}$/;

export function isValidPackageLotRemQuantityTyping(text: string): boolean {
  return text === "" || REM_INPUT_PATTERN.test(text);
}

export function parsePackageLotRemQuantityInput(text: string): number | null {
  const t = text.trim().replace(/,/g, "");
  if (!t || t === ".") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 使用残の上限 = 出庫数量 − 0.1（0 未満は 0） */
export function maxRemQuantityFromOut(outQuantity: string): number | null {
  const out = parsePackageLotRemQuantityInput(outQuantity);
  if (out == null || out <= 0) return null;
  const max = Math.round((out - 0.1) * 100) / 100;
  return max > 0 ? max : 0;
}

export function validateRemQuantityAgainstOut(remText: string, outQuantity: string): string | null {
  const out = parsePackageLotRemQuantityInput(outQuantity);
  if (out == null || out <= 0) return null;

  const rem = parsePackageLotRemQuantityInput(remText);
  if (rem == null) return null;

  const maxRem = maxRemQuantityFromOut(outQuantity);
  const outLabel = formatPackageLotQuantity(out);
  const maxLabel = formatPackageLotQuantity(maxRem);

  if (rem >= out) {
    return `使用残は出庫数量（${outLabel} Kg）未満で入力してください。上限は ${maxLabel} Kg です。`;
  }
  if (maxRem != null && rem > maxRem) {
    return `使用残の上限は ${maxLabel} Kg です（出庫数量 − 0.1）。`;
  }
  return null;
}

export function normalizePackageLotRemQuantityInput(text: string, outQuantity: string): string {
  const out = parsePackageLotRemQuantityInput(outQuantity);
  if (out == null || out <= 0) return "";

  let rem = parsePackageLotRemQuantityInput(text);
  if (rem == null) return "";

  const maxRem = maxRemQuantityFromOut(outQuantity) ?? 0;
  if (rem >= out) rem = maxRem;
  rem = Math.max(0, Math.min(rem, maxRem));
  return formatPackageLotQuantity(rem);
}

const rowFields = (row: PackageLotDetailRowIndex) => {
  if (row === 1) {
    return {
      rem: "remQuantity1" as const,
      out: "outQuantity1" as const,
      use: "useQuantity1" as const
    };
  }
  if (row === 2) {
    return {
      rem: "remQuantity2" as const,
      out: "outQuantity2" as const,
      use: "useQuantity2" as const
    };
  }
  return {
    rem: "remQuantity3" as const,
    out: "outQuantity3" as const,
    use: "useQuantity3" as const
  };
};

export function applyRemQuantityChange(
  form: PackageLotEditFormData,
  row: PackageLotDetailRowIndex,
  remText: string
): PackageLotEditFormData {
  const { rem, out, use } = rowFields(row);
  return {
    ...form,
    [rem]: remText,
    [use]: calcPackageLotUseQuantity(form[out], remText)
  };
}

export function applyRemQuantityBlur(
  form: PackageLotEditFormData,
  row: PackageLotDetailRowIndex
): PackageLotEditFormData {
  const { rem, out, use } = rowFields(row);
  const normalized = normalizePackageLotRemQuantityInput(form[rem], form[out]);
  return {
    ...form,
    [rem]: normalized,
    [use]: calcPackageLotUseQuantity(form[out], normalized)
  };
}

export function partLotNoForRow(form: PackageLotEditFormData, row: PackageLotDetailRowIndex): string {
  if (row === 1) return form.partLotNo1;
  if (row === 2) return form.partLotNo2;
  return form.partLotNo3;
}

export function outQuantityForRow(form: PackageLotEditFormData, row: PackageLotDetailRowIndex): string {
  const { out } = rowFields(row);
  return form[out];
}

export function remQuantityForRow(form: PackageLotEditFormData, row: PackageLotDetailRowIndex): string {
  const { rem } = rowFields(row);
  return form[rem];
}
