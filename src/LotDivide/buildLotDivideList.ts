/**
 * ロット分割一覧構築（vi_factory2_stock + te_lot_divide 集計 + te_lot_use_item）
 */
import {
  processTypeShortName,
  normalizeProcessTypeCode
} from "../Factory2LotManufacture/factory2LotDisplay";
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { enrichViFactory2StockList } from "../repositories/enrichFactory2Stock";
import type { LotDivideRow } from "./types";

export function buildLotDivideList(cache: MasterEntityCache): LotDivideRow[] {
  const stocks = enrichViFactory2StockList(cache.vi_factory2_stock, cache);
  const divideSum = new Map<number, number>();
  for (const d of cache.te_lot_divide) {
    const prev = divideSum.get(d.data.lot_no) ?? 0;
    divideSum.set(d.data.lot_no, prev + (d.data.divide_quantity ?? 0));
  }

  const useByLot = new Map(cache.te_lot_use_item.map((u) => [u.data.lot_no, u.data]));

  const rows: LotDivideRow[] = [];
  for (const s of stocks) {
    const stock = s.data.factory2_stock ?? 0;
    if (stock <= 0) continue;
    const data = s.data;
    const use = useByLot.get(data.lot_no);
    const processType = /^\d{1,2}$/.test(data.process_type.trim())
      ? normalizeProcessTypeCode(data.process_type)
      : data.process_type.trim();
    const processTypeName =
      data.process_type_name?.trim() ||
      (/^\d{1,2}$/.test(processType) ? processTypeShortName(processType) : processType);

    rows.push({
      id: String(data.lot_no),
      lotNo: data.lot_no,
      processType,
      processTypeName,
      productNo: data.product_no,
      productDate: data.product_date,
      lotName: (data.lot_name ?? "").trim(),
      makeYear: (data.make_year ?? use?.make_year ?? "").toString(),
      itemNo: use?.use_no ?? 0,
      itemName: (data.item_name ?? use?.use_name ?? "").trim(),
      count: (data.count ?? use?.count ?? "").toString(),
      organicClass: (data.organic_class ?? "").trim().toUpperCase(),
      productQuantity: data.product_quantity ?? 0,
      factory2Stock: stock,
      divideQuantity: divideSum.get(data.lot_no) ?? 0
    });
  }

  return rows.sort((a, b) => {
    const da = a.productDate ?? "";
    const db = b.productDate ?? "";
    if (da !== db) return da > db ? -1 : 1;
    if (a.itemNo !== b.itemNo) return b.itemNo - a.itemNo;
    return a.lotNo - b.lotNo;
  });
}
