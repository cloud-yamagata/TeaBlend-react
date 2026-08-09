/**
 * 第2工場入出庫実績 … 検索条件
 */
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import type {
  StoreTransferFa2AppliedSearchCriteria,
  StoreTransferFa2FilterResult,
  StoreTransferFa2ProcessFilter,
  StoreTransferFa2ResultTypeFilter,
  StoreTransferFa2Row,
  StoreTransferFa2TransferTypeFilter
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

const matchesLotNameKeywords = (lotName: string, keywords: string[]): boolean =>
  keywords.every((kw) => lotName.includes(kw));

const matchesTransferDateYear = (transferDate: string | null, filterYearText: string): boolean => {
  if (!transferDate) return false;
  const m = transferDate.match(/^(\d{4})/);
  if (!m) return false;
  return matchesPurchaseTeaYear(Number(m[1]), filterYearText);
};

const resolveProcessTypes = (filter: StoreTransferFa2ProcessFilter): string[] => {
  const all = ["01", "02", "03", "04", "05"] as const;
  const anyChecked = all.some((code) => filter[code]);
  if (!anyChecked) return [...all];
  return all.filter((code) => filter[code]);
};

const resolveTransferTypes = (filter: StoreTransferFa2TransferTypeFilter): string[] => {
  const all = ["1", "2", "3"] as const;
  const anyChecked = all.some((code) => filter[code]);
  if (!anyChecked) return [...all];
  return all.filter((code) => filter[code]);
};

const RESULT_TYPE_FILTER_CODES = ["1", "2", "3", "4", "5", "8"] as const;

const resolveResultTypes = (filter: StoreTransferFa2ResultTypeFilter): string[] => {
  const all = [...RESULT_TYPE_FILTER_CODES];
  const coreUnchecked =
    !filter["1"] && !filter["2"] && !filter["4"] && !filter["5"] && !filter["8"];
  if (coreUnchecked) return all;
  return all.filter((code) => filter[code]);
};

export function buildStoreTransferFa2SearchCriteria(
  year: string,
  lotName: string,
  transferDate: string,
  processFilter: StoreTransferFa2ProcessFilter,
  transferTypeFilter: StoreTransferFa2TransferTypeFilter,
  resultTypeFilter: StoreTransferFa2ResultTypeFilter
): StoreTransferFa2AppliedSearchCriteria {
  const trimmedLotName = lotName.trim();
  return {
    year,
    keywords: trimmedLotName ? [trimmedLotName] : [],
    transferDate: transferDate.trim() || null,
    processTypes: resolveProcessTypes(processFilter),
    transferTypes: resolveTransferTypes(transferTypeFilter),
    resultTypes: resolveResultTypes(resultTypeFilter)
  };
}

/** 検索ボタン活性（年度は必須） */
export function isStoreTransferFa2SearchEnabled(year: string): boolean {
  return year.trim().length > 0;
}

const toFilterResult = (matched: StoreTransferFa2Row[]): StoreTransferFa2FilterResult => ({
  rows: matched,
  totalCount: matched.length
});

export function filterStoreTransferFa2Rows(
  rows: StoreTransferFa2Row[],
  criteria: StoreTransferFa2AppliedSearchCriteria
): StoreTransferFa2FilterResult {
  const processSet = new Set(criteria.processTypes);
  const transferSet = new Set(criteria.transferTypes);
  const resultSet = new Set(criteria.resultTypes);

  let matched = rows.filter((row) => matchesTransferDateYear(row.transferDate, criteria.year));

  if (criteria.keywords.length > 0) {
    matched = matched.filter((row) => matchesLotNameKeywords(row.lotName, criteria.keywords));
  }

  const transferDate = criteria.transferDate;
  if (transferDate) {
    matched = matched.filter((row) => sameCalendarDate(row.transferDate, transferDate));
  }

  matched = matched.filter(
    (row) =>
      processSet.has(row.processType) &&
      transferSet.has(row.transferType) &&
      resultSet.has(row.resultType)
  );

  return toFilterResult(matched);
}
