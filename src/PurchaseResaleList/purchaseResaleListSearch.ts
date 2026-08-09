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
import { PURCHASE_RESALE_LIST_MAX_ROWS } from "./types";

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
  truncated: boolean;
};

export const isPurchaseResaleListSearchEnabled = (year: string): boolean => year.trim() !== "";

const matchesPurchaseResaleListRow = (
  row: PurchaseResaleListRow,
  criteria: PurchaseResaleListAppliedSearch
): boolean => {
  const year = criteria.year.trim();
  if (!year || !matchesPurchaseTeaYear(row.year, year)) return false;

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
  if (!criteria.year.trim()) return [];
  return allRows.filter((row) => matchesPurchaseResaleListRow(row, criteria));
}

export function filterPurchaseResaleListRows(
  allRows: PurchaseResaleListRow[],
  criteria: PurchaseResaleListAppliedSearch
): PurchaseResaleListFilterResult {
  const year = criteria.year.trim();
  if (!year) {
    return { rows: [], totalCount: 0, truncated: false };
  }

  const matched = filterPurchaseResaleListRowsAll(allRows, criteria);
  const totalCount = matched.length;
  const truncated = totalCount > PURCHASE_RESALE_LIST_MAX_ROWS;
  const rows = truncated ? matched.slice(0, PURCHASE_RESALE_LIST_MAX_ROWS) : matched;

  return { rows, totalCount, truncated };
}
