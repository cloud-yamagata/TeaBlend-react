/**
 * 2段目・検索条件エリアの仕様
 * - 各グループ: 1件以上チェックあり & 全件チェックでない → そのコードだけ対象
 * - 全OFF / 全ON は同じ（そのグループでは絞り込まない）
 */
import type {
  Factory2LotStatusCheck,
  Factory2OrganicCheck,
  Factory2ProcessCheck,
  Factory2ProcessFilter
} from "./types";

/** グループ内のチェックから、絞込用コード集合（条件なしは null） */
export function selectedCodesOrNull<const T extends string>(
  items: readonly { code: T; checked: boolean }[]
): Set<T> | null {
  const checked = items.filter((i) => i.checked);
  if (checked.length === 0 || checked.length === items.length) {
    return null;
  }
  return new Set(checked.map((i) => i.code));
}

export function lotStatusCodesFromCheck(checks: Factory2LotStatusCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "1", checked: checks.active },
    { code: "2", checked: checks.complete },
    { code: "3", checked: checks.confirm }
  ]);
}

export function processCodesFromCheck(checks: Factory2ProcessCheck): Set<string> | null {
  return selectedCodesOrNull(
    (["02", "03", "04", "05"] as const satisfies readonly Factory2ProcessFilter[]).map(
      (code) => ({
        code,
        checked: checks[code]
      })
    )
  );
}

export function organicCodesFromCheck(checks: Factory2OrganicCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "A", checked: checks.organic },
    { code: "B", checked: checks.pesticideFree },
    { code: "C", checked: checks.general }
  ]);
}

/** 検索ボタン活性（年度は必須・当年下2桁が初期値） */
export function isFactory2SearchEnabled(year: string): boolean {
  return year.trim().length > 0;
}
