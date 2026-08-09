/**
 * vi_factory2_stock を te_lot_base / te_lot_use_item で補完（一覧と同じロット属性）。
 */
import {
  normalizeProcessTypeCode,
  processTypeShortName
} from "../Factory2LotManufacture/factory2LotDisplay";
import {
  ViFactory2Stock,
  type MasterEntityCache,
  type ViFactory2StockData
} from "../domain/masterTableEntityModels";

export function enrichViFactory2StockData(
  data: ViFactory2StockData,
  cache: MasterEntityCache
): ViFactory2StockData {
  const base = cache.te_lot_base.find((b) => b.data.lot_no === data.lot_no)?.data;
  const use = cache.te_lot_use_item.find((u) => u.data.lot_no === data.lot_no)?.data;

  if (!base && !use) {
    return data;
  }

  const processTypeRaw = (base?.process_type ?? data.process_type).trim();
  const processType = /^\d{1,2}$/.test(processTypeRaw)
    ? normalizeProcessTypeCode(processTypeRaw)
    : processTypeRaw;

  let processTypeName = data.process_type_name?.trim() || "";
  if (!processTypeName) {
    processTypeName = /^\d{1,2}$/.test(processType)
      ? processTypeShortName(processType)
      : processType;
  }

  return {
    ...data,
    process_type: processType,
    process_type_name: processTypeName || null,
    product_no: base?.product_no ?? data.product_no,
    product_date: data.product_date ?? (base?.work_date ?? null),
    item_name: use?.use_name ?? data.item_name,
    lot_name: base?.lot_name ?? data.lot_name,
    organic_class: base?.organic_class ?? data.organic_class,
    make_year: use?.make_year ?? data.make_year,
    count: use?.count ?? data.count
  };
}

export function enrichViFactory2StockList(
  stocks: ViFactory2Stock[],
  cache: MasterEntityCache
): ViFactory2Stock[] {
  return stocks.map((s) => ViFactory2Stock.fromData(enrichViFactory2StockData(s.data, cache)));
}
