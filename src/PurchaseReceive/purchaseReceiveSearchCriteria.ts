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

export const isPurchaseReceiveSearchEnabled = ({
  yearFilterEnabled,
  year,
  keyword1,
  keyword2,
  keyword3,
  purchaseDate,
  statusFilter
}: {
  yearFilterEnabled: boolean;
  year: string;
  keyword1: string;
  keyword2: string;
  keyword3: string;
  purchaseDate: string;
  statusFilter: PurchaseReceiveStatusFilter;
}): boolean => {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    keyword1.trim() !== "" ||
    keyword2.trim() !== "" ||
    keyword3.trim() !== "" ||
    purchaseDate.trim() !== "" ||
    anyInGroup(statusFilter)
  );
};

export type PurchaseReceiveFilterResult = {
  rows: PurchaseReceiveRow[];
  totalCount: number;
};

const matchesPurchaseReceiveRow = (
  row: PurchaseReceiveRow,
  criteria: PurchaseReceiveAppliedSearchCriteria
): boolean => {
  if (criteria.year != null && !matchesPurchaseTeaYear(row.year, criteria.year)) return false;

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
  return allRows.filter((row) => matchesPurchaseReceiveRow(row, criteria));
}

export function filterPurchaseReceiveRows(
  allRows: PurchaseReceiveRow[],
  criteria: PurchaseReceiveAppliedSearchCriteria
): PurchaseReceiveFilterResult {
  const matched = filterPurchaseReceiveRowsAll(allRows, criteria);
  return { rows: matched, totalCount: matched.length };
}
