/**
 * 仕入受入情報一覧 … 検索条件の判定・絞り込み
 */
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import type {
  PurchaseReceiveAppliedSearchCriteria,
  PurchaseReceiveRow,
  PurchaseReceiveStatusFilter
} from "./types";
import { PURCHASE_RECEIVE_MAX_ROWS } from "./types";

const keywordHaystack = (row: PurchaseReceiveRow): string =>
  `${row.purchase}${row.producer}${row.target}${row.targetPlan}`;

const selectedStatusCodes = (filter: PurchaseReceiveStatusFilter): Set<string> | null => {
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

export const isPurchaseReceiveSearchEnabled = (year: string): boolean => year.trim().length > 0;

export type PurchaseReceiveFilterResult = {
  rows: PurchaseReceiveRow[];
  totalCount: number;
  truncated: boolean;
};

const matchesPurchaseReceiveRow = (
  row: PurchaseReceiveRow,
  criteria: PurchaseReceiveAppliedSearchCriteria
): boolean => {
  if (!matchesPurchaseTeaYear(row.year, criteria.year)) return false;

  for (const keyword of criteria.keywords) {
    if (!matchesContains(keywordHaystack(row), keyword)) return false;
  }

  const purchaseDate = criteria.purchaseDate?.trim() || null;
  if (purchaseDate) {
    const rowYmd = normalizeDateToYmd(row.purchaseDate);
    if (rowYmd !== purchaseDate) return false;
  }

  const statusCodes = selectedStatusCodes(criteria.statusFilter);
  if (statusCodes && !statusCodes.has(row.status)) return false;

  return true;
};

export function filterPurchaseReceiveRowsAll(
  allRows: PurchaseReceiveRow[],
  criteria: PurchaseReceiveAppliedSearchCriteria
): PurchaseReceiveRow[] {
  if (!criteria.year.trim()) return [];
  return allRows.filter((row) => matchesPurchaseReceiveRow(row, criteria));
}

export function filterPurchaseReceiveRows(
  allRows: PurchaseReceiveRow[],
  criteria: PurchaseReceiveAppliedSearchCriteria
): PurchaseReceiveFilterResult {
  const matched = filterPurchaseReceiveRowsAll(allRows, criteria);
  const totalCount = matched.length;
  const truncated = totalCount > PURCHASE_RECEIVE_MAX_ROWS;
  const rows = truncated ? matched.slice(0, PURCHASE_RECEIVE_MAX_ROWS) : matched;
  return { rows, totalCount, truncated };
}
