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

export const isFactory1RresultSearchEnabled = ({
  yearFilterEnabled,
  year,
  keyword1,
  keyword2,
  keyword3,
  workDate,
  statusFilter
}: {
  yearFilterEnabled: boolean;
  year: string;
  keyword1: string;
  keyword2: string;
  keyword3: string;
  workDate: string;
  statusFilter: Factory1RresultStatusFilter;
}): boolean => {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    keyword1.trim() !== "" ||
    keyword2.trim() !== "" ||
    keyword3.trim() !== "" ||
    workDate.trim() !== "" ||
    anyInGroup(statusFilter)
  );
};

export type Factory1RresultFilterResult = {
  rows: Factory1RresultRow[];
  totalCount: number;
};

const matchesRow = (
  row: Factory1RresultRow,
  criteria: Factory1RresultAppliedSearchCriteria
): boolean => {
  if (criteria.year != null && !matchesMakeYear(row.year, criteria.year)) return false;

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
  return {
    rows: matched,
    totalCount: matched.length
  };
}
