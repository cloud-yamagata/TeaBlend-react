/**
 * ロット分割 … 検索条件（WPF MainWindow 相当）
 */
import type {
  LotDivideAppliedSearchCriteria,
  LotDivideOrganicFilter,
  LotDivideProcessFilter,
  LotDivideRow
} from "./types";

const PROCESS_CODES = ["02", "03", "04", "05"] as const;
const ORGANIC_CODES = ["A", "B", "C"] as const;

export const defaultLotDivideProcessFilter = (): LotDivideProcessFilter => ({
  "02": false,
  "03": false,
  "04": false,
  "05": false
});

export const defaultLotDivideOrganicFilter = (): LotDivideOrganicFilter => ({
  A: false,
  B: false,
  C: false
});

const sameCalendarDate = (value: string | null, yyyyMmDd: string): boolean => {
  if (!value || !yyyyMmDd) return false;
  const norm = (s: string) => {
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return s;
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  };
  return norm(value) === norm(yyyyMmDd);
};

export function buildLotDivideSearchCriteria(
  processFilter: LotDivideProcessFilter,
  organicFilter: LotDivideOrganicFilter,
  productDate: string,
  nameQuery: string
): LotDivideAppliedSearchCriteria {
  const anyProcess = PROCESS_CODES.some((c) => processFilter[c]);
  const anyOrganic = ORGANIC_CODES.some((c) => organicFilter[c]);
  return {
    processTypes: anyProcess ? PROCESS_CODES.filter((c) => processFilter[c]) : null,
    organicClasses: anyOrganic ? ORGANIC_CODES.filter((c) => organicFilter[c]) : null,
    productDate: productDate.trim() || null,
    nameQuery: nameQuery.trim()
  };
}

export function isLotDivideSearchEnabled(
  processFilter: LotDivideProcessFilter,
  organicFilter: LotDivideOrganicFilter,
  productDate: string,
  nameQuery: string
): boolean {
  const anyProcess = PROCESS_CODES.some((c) => processFilter[c]);
  const anyOrganic = ORGANIC_CODES.some((c) => organicFilter[c]);
  return anyProcess || anyOrganic || productDate.trim() !== "" || nameQuery.trim() !== "";
}

export const LOT_DIVIDE_MAX_ROWS = 500;

export function filterLotDivideRows(
  rows: LotDivideRow[],
  criteria: LotDivideAppliedSearchCriteria
): { rows: LotDivideRow[]; totalCount: number; truncated: boolean } {
  let matched = rows;

  if (criteria.processTypes) {
    const set = new Set(criteria.processTypes);
    matched = matched.filter((r) => set.has(r.processType));
  }
  if (criteria.organicClasses) {
    const set = new Set(criteria.organicClasses);
    matched = matched.filter((r) => set.has(r.organicClass));
  }
  if (criteria.productDate) {
    matched = matched.filter((r) => sameCalendarDate(r.productDate, criteria.productDate!));
  }
  if (criteria.nameQuery) {
    const q = criteria.nameQuery.toLowerCase();
    matched = matched.filter(
      (r) =>
        r.lotName.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        String(r.productNo).includes(criteria.nameQuery)
    );
  }

  const totalCount = matched.length;
  const truncated = totalCount > LOT_DIVIDE_MAX_ROWS;
  return {
    rows: truncated ? matched.slice(0, LOT_DIVIDE_MAX_ROWS) : matched,
    totalCount,
    truncated
  };
}
