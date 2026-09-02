/**
 * 第3工場入出庫実績 … 検索条件
 */
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import type {
  StoreTransferAppliedSearchCriteria,
  StoreTransferFilterResult,
  StoreTransferResultTypeFilter,
  StoreTransferRow,
  StoreTransferTransferTypeFilter
} from "./types";

const sameCalendarDate = (value: string | null, yyyyMmDd: string): boolean => {
  if (!value || !yyyyMmDd) return false;
  const norm = (s: string) => {
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return s;
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  };
  return norm(value) === norm(yyyyMmDd);
};

const matchesLotNoKeywords = (lotNo: string, keywords: string[]): boolean =>
  keywords.every((kw) => lotNo.includes(kw));

const matchesTransferDateYear = (transferDate: string | null, filterYearText: string): boolean => {
  if (!transferDate) return false;
  const m = transferDate.match(/^(\d{4})/);
  if (!m) return false;
  return matchesPurchaseTeaYear(Number(m[1]), filterYearText);
};

const resolveTransferTypes = (filter: StoreTransferTransferTypeFilter): string[] => {
  const all = ["1", "2", "3"] as const;
  const anyChecked = all.some((code) => filter[code]);
  if (!anyChecked) return [...all];
  return all.filter((code) => filter[code]);
};

const RESULT_TYPE_FILTER_CODES = ["1", "2", "3", "4", "5", "8"] as const;

const resolveResultTypes = (filter: StoreTransferResultTypeFilter): string[] => {
  const all = [...RESULT_TYPE_FILTER_CODES];
  const coreUnchecked =
    !filter["1"] && !filter["2"] && !filter["4"] && !filter["5"] && !filter["8"];
  if (coreUnchecked) return all;
  return all.filter((code) => filter[code]);
};

export function buildStoreTransferSearchCriteria(
  year: string | null,
  lotNo: string,
  transferDate: string,
  transferTypeFilter: StoreTransferTransferTypeFilter,
  resultTypeFilter: StoreTransferResultTypeFilter
): StoreTransferAppliedSearchCriteria {
  const trimmedLotNo = lotNo.trim();
  return {
    year,
    keywords: trimmedLotNo ? [trimmedLotNo] : [],
    transferDate: transferDate.trim() || null,
    transferTypes: resolveTransferTypes(transferTypeFilter),
    resultTypes: resolveResultTypes(resultTypeFilter)
  };
};

type StoreTransferSearchEnabledArgs = {
  yearFilterEnabled: boolean;
  year: string;
  lotNo: string;
  transferDate: string;
  transferTypeFilter: StoreTransferTransferTypeFilter;
  resultTypeFilter: StoreTransferResultTypeFilter;
};

export function isStoreTransferSearchEnabled({
  yearFilterEnabled,
  year,
  lotNo,
  transferDate,
  transferTypeFilter,
  resultTypeFilter
}: StoreTransferSearchEnabledArgs): boolean {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    lotNo.trim() !== "" ||
    transferDate.trim() !== "" ||
    anyInGroup(transferTypeFilter) ||
    anyInGroup(resultTypeFilter)
  );
}

const toFilterResult = (matched: StoreTransferRow[]): StoreTransferFilterResult => ({
  rows: matched,
  totalCount: matched.length
});

export function filterStoreTransferRows(
  rows: StoreTransferRow[],
  criteria: StoreTransferAppliedSearchCriteria
): StoreTransferFilterResult {
  const transferSet = new Set(criteria.transferTypes);
  const resultSet = new Set(criteria.resultTypes);

  let matched =
    criteria.year == null
      ? [...rows]
      : rows.filter((row) => matchesTransferDateYear(row.transferDate, criteria.year!));

  if (criteria.keywords.length > 0) {
    matched = matched.filter((row) => matchesLotNoKeywords(row.lotNo, criteria.keywords));
  }

  const transferDate = criteria.transferDate;
  if (transferDate) {
    matched = matched.filter((row) => sameCalendarDate(row.transferDate, transferDate));
  }

  matched = matched.filter(
    (row) => transferSet.has(row.transferType) && resultSet.has(row.resultType)
  );

  return toFilterResult(matched);
}
