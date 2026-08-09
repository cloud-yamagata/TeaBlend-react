/**
 * 第1工場生産実績情報一覧 … 検索条件の判定・絞り込み
 */
import { matchesMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import type {
  Factory1RresultAppliedSearchCriteria,
  Factory1RresultRow,
  Factory1RresultStatusFilter
} from "./types";
import { FACTORY1_RRESULT_MAX_ROWS } from "./types";

const selectedStatusCodes = (filter: Factory1RresultStatusFilter): Set<string> | null => {
  const items = [
    { code: "未", checked: filter.mi },
    { code: "残", checked: filter.zan },
    { code: "完", checked: filter.kan },
    { code: "誤", checked: filter.go }
  ];
  const checked = items.filter((item) => item.checked);
  if (checked.length === 0) return null;
  return new Set(checked.map((item) => item.code));
};

export const isFactory1RresultSearchEnabled = (year: string): boolean => year.trim().length > 0;

export type Factory1RresultFilterResult = {
  rows: Factory1RresultRow[];
  totalCount: number;
  truncated: boolean;
};

const matchesRow = (
  row: Factory1RresultRow,
  criteria: Factory1RresultAppliedSearchCriteria
): boolean => {
  if (!matchesMakeYear(row.year, criteria.year)) return false;

  if (criteria.materialUsableOnly && !row.isMaterialSelectable) return false;

  // WPF SelLot: target（用途）の Contains AND
  for (const kw of criteria.keywords) {
    if (!matchesContains(row.target, kw)) return false;
  }

  if (criteria.workDate) {
    const rowDate = normalizeDateToYmd(row.workDate);
    const filterDate = normalizeDateToYmd(criteria.workDate);
    if (!rowDate || !filterDate || rowDate !== filterDate) return false;
  }

  const statusCodes = selectedStatusCodes(criteria.statusFilter);
  if (statusCodes && !statusCodes.has(row.status)) return false;

  return true;
};

export function filterFactory1RresultRows(
  rows: Factory1RresultRow[],
  criteria: Factory1RresultAppliedSearchCriteria
): Factory1RresultFilterResult {
  const matched = rows.filter((row) => matchesRow(row, criteria));
  const totalCount = matched.length;
  const truncated = totalCount > FACTORY1_RRESULT_MAX_ROWS;
  return {
    rows: truncated ? matched.slice(0, FACTORY1_RRESULT_MAX_ROWS) : matched,
    totalCount,
    truncated
  };
}
