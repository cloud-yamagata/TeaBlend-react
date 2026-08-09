/**
 * 仕上個別情報登録 … 有機区分チェック（Factory2 と同じ全OFF/全ON=絞込なし）
 */
import type { FinishCategoryOrganicCheck } from "./types";

export function selectedCodesOrNull<const T extends string>(
  items: readonly { code: T; checked: boolean }[]
): Set<T> | null {
  const checked = items.filter((i) => i.checked);
  if (checked.length === 0 || checked.length === items.length) {
    return null;
  }
  return new Set(checked.map((i) => i.code));
}

export function organicCodesFromCheck(checks: FinishCategoryOrganicCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "A", checked: checks.organic },
    { code: "B", checked: checks.pesticideFree },
    { code: "C", checked: checks.general }
  ]);
}

export const finishCategoryDefaultOrganicCheck = (): FinishCategoryOrganicCheck => ({
  organic: false,
  pesticideFree: false,
  general: false
});
