/**
 * 月次計画 lot_part_info → 第2工場登録モーダル使用部品行（在庫照合付き）
 */
import type { ViFactory2Stock } from "../domain/masterTableEntityModels";
import { partInventoryLotNo, type MonthlyPlanPartItem } from "../MonthlyPlan/monthlyPlanDisplayUtils";
import { formatFactory2ProcessType, normalizeProcessTypeCode } from "./factory2LotDisplay";
import type { Factory2LotEditPartRow } from "./factory2LotEditTypes";

const formatUseQuantity = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);

const numText = (value: number | null | undefined): string =>
  value != null && Number.isFinite(value) ? String(value) : "";

const processLabel = (code: string | null | undefined): string => {
  const c = code?.trim();
  if (!c) return "";
  return formatFactory2ProcessType(normalizeProcessTypeCode(c));
};

const pickBestStock = (list: ViFactory2Stock[]): ViFactory2Stock | null => {
  if (!list.length) return null;
  return [...list].sort((a, b) => {
    const sa = a.data.factory2_stock ?? 0;
    const sb = b.data.factory2_stock ?? 0;
    if (sb !== sa) return sb - sa;
    if (a.data.lot_no !== b.data.lot_no) return a.data.lot_no - b.data.lot_no;
    return a.data.product_no - b.data.product_no;
  })[0];
};

const indexStocksByLotNo = (stocks: ViFactory2Stock[]): Map<number, ViFactory2Stock[]> => {
  const m = new Map<number, ViFactory2Stock[]>();
  for (const s of stocks) {
    const k = s.data.lot_no;
    const arr = m.get(k) ?? [];
    arr.push(s);
    m.set(k, arr);
  }
  return m;
};

const indexStocksByProductNo = (stocks: ViFactory2Stock[]): Map<number, ViFactory2Stock[]> => {
  const m = new Map<number, ViFactory2Stock[]>();
  for (const s of stocks) {
    const k = s.data.product_no;
    const arr = m.get(k) ?? [];
    arr.push(s);
    m.set(k, arr);
  }
  return m;
};

const resolveStock = (
  item: MonthlyPlanPartItem,
  byLot: Map<number, ViFactory2Stock[]>,
  byProduct: Map<number, ViFactory2Stock[]>
): ViFactory2Stock | null => {
  const inventoryLotNo = partInventoryLotNo(item);
  if (inventoryLotNo != null) {
    const list = byLot.get(inventoryLotNo) ?? [];
    const filtered =
      item.productNo != null
        ? list.filter((s) => s.data.product_no === item.productNo)
        : list;
    return pickBestStock(filtered.length ? filtered : list);
  }
  if (item.productNo != null) {
    return pickBestStock(byProduct.get(item.productNo) ?? []);
  }
  return null;
};

const useQuantityText = (
  planWeight: number | null,
  stock: ViFactory2Stock | null
): string => {
  if (planWeight != null && Number.isFinite(planWeight) && planWeight > 0) {
    let n = planWeight;
    const max = stock?.data.factory2_stock;
    if (max != null && max > 0) n = Math.min(n, max);
    return formatUseQuantity(n);
  }
  const max = stock?.data.factory2_stock;
  if (max != null && max > 0) return formatUseQuantity(max);
  return "";
};

/** 登録API向け子ロットNo */
const registrationChildLotNo = (item: MonthlyPlanPartItem, stock: ViFactory2Stock | null): string => {
  if (stock) return String(stock.data.lot_no);
  if (item.partLotNo != null) return String(item.partLotNo);
  if (item.lotNo != null) return String(item.lotNo);
  return "";
};

const buildRowFromPlanItem = (
  item: MonthlyPlanPartItem,
  stock: ViFactory2Stock | null,
  qty: string,
  index: number
): Factory2LotEditPartRow | null => {
  const childLot = registrationChildLotNo(item, stock);
  const productNoText =
    numText(item.productNo) || (stock ? String(stock.data.product_no) : "");

  if (!childLot && !productNoText) return null;

  const partNo = childLot || productNoText;

  return {
    id: stock
      ? `plan-stock-${childLot}-${productNoText}-${index}`
      : `plan-raw-${index}-${childLot}-${productNoText}`,
    parentLotNo: numText(item.lotNo),
    processName:
      processLabel(item.processType) || (stock?.data.process_type_name?.trim() ?? ""),
    partLotNo: numText(item.partLotNo) || (stock ? String(stock.data.lot_no) : ""),
    lotNo: childLot,
    partNo,
    productNo: productNoText,
    partName: (item.lotName?.trim() || stock?.data.lot_name) ?? "",
    makeYear:
      numText(item.makeYear) || (stock?.data.make_year?.trim() ?? ""),
    count: numText(item.count) || (stock?.data.count?.trim() ?? ""),
    useQuantity: qty,
    remarks: item.remarks?.trim() ?? ""
  };
};

export function monthlyPlanPartsToFactory2EditParts(
  items: MonthlyPlanPartItem[],
  stocks: ViFactory2Stock[]
): { rows: Factory2LotEditPartRow[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!items.length) return { rows: [], warnings };

  const byLot = indexStocksByLotNo(stocks);
  const byProduct = indexStocksByProductNo(stocks);
  const rows: Factory2LotEditPartRow[] = [];

  items.forEach((item, index) => {
    const stock = resolveStock(item, byLot, byProduct);
    const qty = useQuantityText(item.useUnitWeight, stock);
    const row = buildRowFromPlanItem(item, stock, qty, index);

    if (!row) return;

    if (!stock) {
      const label =
        row.partName || row.productNo || row.partLotNo || row.parentLotNo || `行${index + 1}`;
      warnings.push(
        `使用部品「${label}」は在庫に照合できませんでした。登録前に在庫を確認してください。`
      );
    }

    rows.push(row);
  });

  return { rows, warnings };
}
