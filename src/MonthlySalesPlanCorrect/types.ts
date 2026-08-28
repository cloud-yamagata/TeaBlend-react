/**
 * 月次販売計画（MonthlySalesPlanCorrect）型
 */
import type { TrItem } from "../MonthlyPlan/types";

export type MonthlySalesPlanRow = {
  id: string;
  year: number;
  month: number;
  itemNo: number;
  itemName: string;
  salesSize: number;
  remarks: string;
  finishItemNo: number | null;
  finishItemName: string;
  packageSize: number;
  needSize: number;
};

export function currentYearMonthValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseYearMonthValue(value: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  return { year, month };
}

/** 必要量(kg) = 販売数 * 梱包サイズ(g) / 1000 */
export function calcNeedSizeKg(salesSize: number, packageSize: number): number {
  return (salesSize * packageSize) / 1000;
}

export function buildItemLookup(items: readonly TrItem[]): Map<number, TrItem> {
  const map = new Map<number, TrItem>();
  for (const item of items) {
    if (item.itemNo == null) continue;
    map.set(item.itemNo, item);
  }
  return map;
}

export function buildBomByParent(
  boms: readonly { data: { parent_item_no: number; child_item_no: number } }[]
): Map<number, number> {
  const map = new Map<number, number>();
  for (const bom of boms) {
    map.set(bom.data.parent_item_no, bom.data.child_item_no);
  }
  return map;
}

export function enrichMonthlySalesPlanRow(
  base: {
    year: number;
    month: number;
    itemNo: number;
    itemName: string;
    salesSize: number;
    remarks: string;
  },
  itemByNo: Map<number, TrItem>,
  bomByParent: Map<number, number>
): MonthlySalesPlanRow {
  const item = itemByNo.get(base.itemNo);
  const packageSize = item?.packageSize ?? 0;
  const finishItemNo = bomByParent.get(base.itemNo) ?? null;
  const finish = finishItemNo != null ? itemByNo.get(finishItemNo) : undefined;
  const itemName = (base.itemName || item?.itemName || "").trim();
  return {
    id: `${base.year}-${base.month}-${base.itemNo}`,
    year: base.year,
    month: base.month,
    itemNo: base.itemNo,
    itemName,
    salesSize: base.salesSize,
    remarks: base.remarks,
    finishItemNo,
    finishItemName: finish?.itemName ?? "",
    packageSize,
    needSize: calcNeedSizeKg(base.salesSize, packageSize)
  };
}

export function withSalesSize(row: MonthlySalesPlanRow, salesSize: number): MonthlySalesPlanRow {
  return {
    ...row,
    salesSize,
    needSize: calcNeedSizeKg(salesSize, row.packageSize)
  };
}

export function withRemarks(row: MonthlySalesPlanRow, remarks: string): MonthlySalesPlanRow {
  return { ...row, remarks };
}

export function hasRemarks(remarks: string): boolean {
  return remarks.trim().length > 0;
}

/** 参照年月の販売数で一覧を上書き。参照側にない商品は据え置き */
export function applyReferenceSalesSizes(
  rows: readonly MonthlySalesPlanRow[],
  reference: ReadonlyArray<{ item_no: number; sales_size: number }>
): MonthlySalesPlanRow[] {
  const byItemNo = new Map<number, number>();
  for (const rec of reference) {
    byItemNo.set(rec.item_no, rec.sales_size ?? 0);
  }
  return rows.map((row) => {
    const salesSize = byItemNo.get(row.itemNo);
    if (salesSize === undefined) return row;
    return withSalesSize(row, salesSize);
  });
}
