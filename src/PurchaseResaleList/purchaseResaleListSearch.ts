/**
 * 振分実績一覧 … 検索条件の判定・絞り込み（PurchaseResaleList 相当）
 */
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import type {
  PurchaseResaleListAppliedSearch,
  PurchaseResaleListRow,
  PurchaseResaleListTeaLifeFilter
} from "./types";

const TEA_LIFE_ALL = ["1茶", "2茶", "3茶", "4茶", "番茶", "秋番茶"] as const;

const resolveTeaLifeCodes = (filter: PurchaseResaleListTeaLifeFilter): readonly string[] => {
  const selected: string[] = [];
  if (filter.tea1) selected.push("1茶");
  if (filter.tea2) selected.push("2茶");
  if (filter.tea3) selected.push("3茶");
  if (filter.tea4) selected.push("4茶");
  if (filter.bancha) selected.push("番茶");
  if (filter.aki) selected.push("秋番茶");
  return selected.length > 0 ? selected : TEA_LIFE_ALL;
};

export type PurchaseResaleListFilterResult = {
  rows: PurchaseResaleListRow[];
  totalCount: number;
};

export const isPurchaseResaleListSearchEnabled = ({
  yearFilterEnabled,
  year,
  transfer,
  purchaseDate,
  teaLifeFilter,
  limitToContext
}: {
  yearFilterEnabled: boolean;
  year: string;
  transfer: string;
  purchaseDate: string;
  teaLifeFilter: PurchaseResaleListTeaLifeFilter;
  limitToContext: boolean;
}): boolean => {
  if (!yearFilterEnabled) return true;
  if (year.trim() !== "") return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    transfer.trim() !== "" ||
    purchaseDate.trim() !== "" ||
    anyInGroup(teaLifeFilter) ||
    limitToContext
  );
};

const matchesPurchaseResaleListRow = (
  row: PurchaseResaleListRow,
  criteria: PurchaseResaleListAppliedSearch
): boolean => {
  if (criteria.year != null && !matchesPurchaseTeaYear(row.year, criteria.year)) return false;

  if (criteria.contextPurchase && row.purchase !== criteria.contextPurchase) return false;
  if (criteria.contextBidNo && row.bidNo !== criteria.contextBidNo) return false;

  const transferNeedle = criteria.transfer.trim();
  if (transferNeedle && !matchesContains(row.transfer, transferNeedle)) return false;

  const teaLifeCodes = new Set(resolveTeaLifeCodes(criteria.teaLifeFilter));
  if (!teaLifeCodes.has(row.teaLife)) return false;

  const purchaseDate = criteria.purchaseDate.trim();
  if (purchaseDate) {
    const rowYmd = normalizeDateToYmd(row.purchaseDate);
    if (rowYmd !== purchaseDate) return false;
  }

  return true;
};

/** 検索条件に合致する全行（Excel 出力用・500 件制限なし） */
export function filterPurchaseResaleListRowsAll(
  allRows: PurchaseResaleListRow[],
  criteria: PurchaseResaleListAppliedSearch
): PurchaseResaleListRow[] {
  return allRows.filter((row) => matchesPurchaseResaleListRow(row, criteria));
}

export function filterPurchaseResaleListRows(
  allRows: PurchaseResaleListRow[],
  criteria: PurchaseResaleListAppliedSearch
): PurchaseResaleListFilterResult {
  const matched = filterPurchaseResaleListRowsAll(allRows, criteria);
  return { rows: matched, totalCount: matched.length };
}
