/**
 * 仕入実績情報一覧 … 検索条件の判定・絞り込み
 */
import type {
  PurchaseTtransferAppliedSearchCriteria,
  PurchaseTtransferMaterialFilter,
  PurchaseTtransferRow,
  PurchaseTtransferStatusFilter,
  PurchaseTtransferTargetFilter
} from "./types";

/** 2桁年度入力と te_purchase_tea.year（2桁/4桁混在）を照合 */
export function matchesPurchaseTeaYear(rowYear: number | null, filterYearText: string): boolean {
  const filter = filterYearText.trim();
  if (!filter || rowYear == null) return false;
  const filterNum = Number(filter);
  if (!Number.isFinite(filterNum)) return false;

  const rowNorm = rowYear >= 100 ? rowYear % 100 : rowYear;
  const filterNorm = filterNum >= 100 ? filterNum % 100 : filterNum;
  return rowNorm === filterNorm;
}

const sameCalendarDate = (value: string | null, yyyyMmDd: string): boolean => {
  if (!value || !yyyyMmDd) return false;
  const norm = (s: string) => {
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return s;
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  };
  return norm(value) === norm(yyyyMmDd);
};

const selectedStatusCodes = (filter: PurchaseTtransferStatusFilter): Set<string> | null => {
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

const matchesMaterialFilter = (row: PurchaseTtransferRow, filter: PurchaseTtransferMaterialFilter): boolean => {
  if (!filter.mi && !filter.sumi) return true;

  const isMi = row.hasReceive && !row.hasMaterial;
  const isSumi = row.hasMaterial;
  if (filter.mi && isMi) return true;
  if (filter.sumi && isSumi) return true;
  return false;
};

const matchesTargetFilter = (row: PurchaseTtransferRow, filter: PurchaseTtransferTargetFilter): boolean => {
  if (!filter.ari && !filter.nashi) return true;

  const hasTarget = row.target.trim().length > 0;
  if (filter.ari && hasTarget) return true;
  if (filter.nashi && !hasTarget) return true;
  return false;
};

type PurchaseTtransferSearchEnabledArgs = {
  yearFilterEnabled: boolean;
  year: string;
  purchaseDate: string;
  statusFilter: PurchaseTtransferStatusFilter;
  materialFilter: PurchaseTtransferMaterialFilter;
  targetFilter: PurchaseTtransferTargetFilter;
};

/** 検索ボタン活性（年度チェック OFF 時は全年度可） */
export function isPurchaseTtransferSearchEnabled({
  yearFilterEnabled,
  year,
  purchaseDate,
  statusFilter,
  materialFilter,
  targetFilter
}: PurchaseTtransferSearchEnabledArgs): boolean {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    purchaseDate.trim() !== "" ||
    anyInGroup(statusFilter) ||
    anyInGroup(materialFilter) ||
    anyInGroup(targetFilter)
  );
}

export function filterPurchaseTtransferRows(
  rows: PurchaseTtransferRow[],
  criteria: PurchaseTtransferAppliedSearchCriteria
): PurchaseTtransferRow[] {
  const statusCodes = selectedStatusCodes(criteria.statusFilter);
  const purchaseDate = criteria.purchaseDate?.trim() || null;

  return rows.filter((row) => {
    if (criteria.year != null && !matchesPurchaseTeaYear(row.year, criteria.year)) return false;

    if (purchaseDate && !sameCalendarDate(row.purchaseDate, purchaseDate)) {
      return false;
    }

    if (statusCodes && !statusCodes.has(row.status)) {
      return false;
    }

    if (!matchesMaterialFilter(row, criteria.materialFilter)) {
      return false;
    }

    if (!matchesTargetFilter(row, criteria.targetFilter)) {
      return false;
    }

    return true;
  });
}
