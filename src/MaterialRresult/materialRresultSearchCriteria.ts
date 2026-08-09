/**
 * 原料実績情報一覧 … 検索条件の判定・絞り込み
 */
import { matchesMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import type {
  MaterialRresultAppliedSearchCriteria,
  MaterialRresultOrganicFilter,
  MaterialRresultRow
} from "./types";
import { MATERIAL_RRESULT_MAX_ROWS } from "./types";

const selectedOrganicCodes = (filter: MaterialRresultOrganicFilter): Set<string> | null => {
  const items = [
    { code: "A", checked: filter.a },
    { code: "B", checked: filter.b },
    { code: "C", checked: filter.c }
  ];
  const checked = items.filter((item) => item.checked);
  // WPF GradeSel: チェックなし → A,B,C 全部（= 条件なし）
  if (checked.length === 0) return null;
  return new Set(checked.map((item) => item.code));
};

export const isMaterialRresultSearchEnabled = (year: string): boolean => year.trim().length > 0;

export type MaterialRresultFilterResult = {
  rows: MaterialRresultRow[];
  totalCount: number;
  truncated: boolean;
};

const matchesRow = (
  row: MaterialRresultRow,
  criteria: MaterialRresultAppliedSearchCriteria
): boolean => {
  if (!matchesMakeYear(row.year, criteria.year)) return false;

  if (criteria.materialUsableOnly && !row.isMaterialSelectable) return false;

  // WPF SelLot: material_name Contains AND
  for (const kw of criteria.keywords) {
    if (!matchesContains(row.materialName, kw)) return false;
  }

  if (criteria.purchaseDate) {
    const rowDate = normalizeDateToYmd(row.purchaseDate);
    const filterDate = normalizeDateToYmd(criteria.purchaseDate);
    if (!rowDate || !filterDate || rowDate !== filterDate) return false;
  }

  const organicCodes = selectedOrganicCodes(criteria.organicFilter);
  if (organicCodes && !organicCodes.has(row.organicClass.trim().toUpperCase())) return false;

  return true;
};

export function filterMaterialRresultRows(
  rows: MaterialRresultRow[],
  criteria: MaterialRresultAppliedSearchCriteria
): MaterialRresultFilterResult {
  const matched = rows.filter((row) => matchesRow(row, criteria));
  const totalCount = matched.length;
  const truncated = totalCount > MATERIAL_RRESULT_MAX_ROWS;
  return {
    rows: truncated ? matched.slice(0, MATERIAL_RRESULT_MAX_ROWS) : matched,
    totalCount,
    truncated
  };
}
