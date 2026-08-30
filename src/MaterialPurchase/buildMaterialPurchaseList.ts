/**
 * te_material_purchase から仕上品仕入一覧行を構築・絞り込み
 */
import { matchesMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { MaterialPurchaseRow, MaterialPurchaseSearchFilters } from "./types";

const toDateYmd = (value: string | null): string | null => {
  if (!value) return null;
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return value;
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const sameCalendarDate = (purchaseDate: string | null, yyyyMmDd: string): boolean => {
  if (!purchaseDate || !yyyyMmDd) return false;
  return toDateYmd(purchaseDate) === toDateYmd(yyyyMmDd);
};

/** 仕入日 yyyy-MM-dd から暦年を取得（年度スピナー照合用） */
const purchaseDateCalendarYear = (purchaseDate: string | null): number | null => {
  const ymd = toDateYmd(purchaseDate);
  if (!ymd) return null;
  const m = ymd.match(/^(\d{4})/);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
};

export function buildMaterialPurchaseList(cache: MasterEntityCache): MaterialPurchaseRow[] {
  const rows: MaterialPurchaseRow[] = cache.te_material_purchase.map((entity) => {
    const d = entity.data;
    return {
      id: `${d.item_no}-${d.purchase_no}`,
      purchaseDate: toDateYmd(d.purchase_date),
      itemNo: d.item_no,
      purchaseNo: d.purchase_no,
      itemName: (d.item_name ?? "").trim(),
      purchaseLotNo: (d.purchase_lot_no ?? "").trim(),
      purchaseQuantity: d.purchase_quantity,
      supplier: (d.supplier ?? "").trim()
    };
  });

  rows.sort((a, b) => {
    if (a.itemNo !== b.itemNo) return a.itemNo - b.itemNo;
    const da = a.purchaseDate ?? "";
    const db = b.purchaseDate ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.purchaseNo - b.purchaseNo;
  });

  return rows;
}

/** 検索ボタン活性（年度チェック OFF 時は全年度可） */
export function isMaterialPurchaseSearchEnabled(
  filters: MaterialPurchaseSearchFilters,
  yearFilterEnabled: boolean
): boolean {
  if (!yearFilterEnabled) return true;
  if ((filters.year ?? "").trim().length > 0) return true;
  return (
    filters.itemNo.trim() !== "" ||
    filters.itemName.trim() !== "" ||
    filters.purchaseDate.trim() !== "" ||
    filters.supplier.trim() !== ""
  );
}

/**
 * 一覧絞り込み（指定条件を AND）
 * - 年度: 仕入日の暦年と 2桁年度照合（必須）
 * - 商品No: 完全一致
 * - 商品名: 部分一致（大文字小文字無視）
 * - 仕入日: 同一暦日
 * - 仕入先: 部分一致
 */
export function filterMaterialPurchaseRows(
  rows: MaterialPurchaseRow[],
  filters: MaterialPurchaseSearchFilters
): MaterialPurchaseRow[] {
  const itemNoText = filters.itemNo.trim();
  const itemNo = itemNoText !== "" ? Number(itemNoText) : null;
  const hasItemNo = itemNo != null && Number.isFinite(itemNo);
  const nameQ = filters.itemName.trim().toLowerCase();
  const purchaseDate = filters.purchaseDate.trim();
  const supplierQ = filters.supplier.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.year != null && !matchesMakeYear(purchaseDateCalendarYear(row.purchaseDate), filters.year)) {
      return false;
    }
    if (hasItemNo && row.itemNo !== itemNo) return false;
    if (nameQ && !row.itemName.toLowerCase().includes(nameQ)) return false;
    if (purchaseDate && !sameCalendarDate(row.purchaseDate, purchaseDate)) return false;
    if (supplierQ && !row.supplier.toLowerCase().includes(supplierQ)) return false;
    return true;
  });
}
