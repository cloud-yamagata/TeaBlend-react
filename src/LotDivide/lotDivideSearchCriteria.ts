/**
 * ロット分割 … 検索条件（WPF MainWindow 相当）
 * 年度 UI は第2入出庫（StoreTransferFa2）と同じチェック＋スピナー
 */
import { matchesMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
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

const parseRowMakeYear = (makeYear: string): number | null => {
  const t = makeYear.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
};

export function buildLotDivideSearchCriteria(
  year: string | null,
  processFilter: LotDivideProcessFilter,
  organicFilter: LotDivideOrganicFilter,
  productDate: string,
  nameQuery: string
): LotDivideAppliedSearchCriteria {
  const anyProcess = PROCESS_CODES.some((c) => processFilter[c]);
  const anyOrganic = ORGANIC_CODES.some((c) => organicFilter[c]);
  return {
    year,
    processTypes: anyProcess ? PROCESS_CODES.filter((c) => processFilter[c]) : null,
    organicClasses: anyOrganic ? ORGANIC_CODES.filter((c) => organicFilter[c]) : null,
    productDate: productDate.trim() || null,
    nameQuery: nameQuery.trim()
  };
}

type LotDivideSearchEnabledArgs = {
  yearFilterEnabled: boolean;
  year: string;
  processFilter: LotDivideProcessFilter;
  organicFilter: LotDivideOrganicFilter;
  productDate: string;
  nameQuery: string;
};

/**
 * 検索ボタン活性（第2入出庫と同じ）
 * - 年度チェック ON: 年度あり、または他条件あり
 * - 年度チェック OFF: 他条件なしでも可（全年度）
 */
export function isLotDivideSearchEnabled({
  yearFilterEnabled,
  year,
  processFilter,
  organicFilter,
  productDate,
  nameQuery
}: LotDivideSearchEnabledArgs): boolean {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyProcess = PROCESS_CODES.some((c) => processFilter[c]);
  const anyOrganic = ORGANIC_CODES.some((c) => organicFilter[c]);
  return anyProcess || anyOrganic || productDate.trim() !== "" || nameQuery.trim() !== "";
}

export const LOT_DIVIDE_MAX_ROWS = 500;

export function filterLotDivideRows(
  rows: LotDivideRow[],
  criteria: LotDivideAppliedSearchCriteria
): { rows: LotDivideRow[]; totalCount: number; truncated: boolean } {
  let matched =
    criteria.year == null
      ? [...rows]
      : rows.filter((r) => matchesMakeYear(parseRowMakeYear(r.makeYear), criteria.year!));

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
