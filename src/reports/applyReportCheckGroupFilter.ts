/**
 * レポート checkGroup フィルタ（チェック項目の field != 0 を OR 連結）
 */
import type { ReportFilterDef } from "./registry";
import { reportCheckGroupOptionKey } from "./registry";
import type { ReportFilterValues } from "./components/ReportFilters";

const isNonZero = (value: unknown): boolean => {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0;
};

/** checkGroup でチェックされた列のいずれかが 0 以外の行のみ残す（未チェック時は全件） */
export function filterRowsByCheckGroup(
  rows: Record<string, unknown>[],
  filterDef: ReportFilterDef,
  values: ReportFilterValues
): Record<string, unknown>[] {
  if (filterDef.type !== "checkGroup" || !filterDef.options?.length) {
    return rows;
  }

  const checkedFields = filterDef.options
    .filter((opt) => values[reportCheckGroupOptionKey(filterDef.key, opt.key)] === "1")
    .map((opt) => opt.field);

  if (checkedFields.length === 0) {
    return rows;
  }

  return rows.filter((row) => checkedFields.some((field) => isNonZero(row[field])));
}

/** API パラメータから checkGroup 用キーを除去 */
export function stripCheckGroupParams(
  params: Record<string, unknown>,
  filters: ReportFilterDef[]
): void {
  for (const f of filters) {
    if (f.type !== "checkGroup") continue;
    for (const opt of f.options ?? []) {
      delete params[reportCheckGroupOptionKey(f.key, opt.key)];
    }
  }
}
