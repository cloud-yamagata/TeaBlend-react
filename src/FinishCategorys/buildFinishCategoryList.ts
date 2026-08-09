/**
 * FinishCategorys: te_lot_base × te_lot_use_item（工程 03 のみ）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import {
  formatFactory2LotStatus,
  formatFactory2OrganicClass
} from "../Factory2LotManufacture/factory2LotDisplay";
import type { FinishCategoryRow } from "./types";

const FINISH_PROCESS_TYPE = "03";

const parseOptionalInt = (raw: string | null | undefined): number | null => {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const fractionWeightTotal = (
  fractionWeight: number | null,
  fractionNumber: number | null
): number => {
  const w = fractionWeight ?? 0;
  const n = fractionNumber ?? 0;
  return w * n;
};

const sortFinishRows = (rows: FinishCategoryRow[]): FinishCategoryRow[] =>
  [...rows].sort((a, b) => {
    const dateCmp = (b.workDate ?? "").localeCompare(a.workDate ?? "");
    if (dateCmp !== 0) return dateCmp;
    const itemCmp = (b.itemNo ?? 0) - (a.itemNo ?? 0);
    if (itemCmp !== 0) return itemCmp;
    return (a.lotNo ?? 0) - (b.lotNo ?? 0);
  });

/** bootstrap キャッシュから一覧行を構築（工程 03 のみ） */
export function buildFinishCategoryList(cache: MasterEntityCache): FinishCategoryRow[] {
  const useByLot = new Map(cache.te_lot_use_item.map((e) => [e.data.lot_no, e]));
  const rows: FinishCategoryRow[] = [];

  for (const base of cache.te_lot_base) {
    const b = base.data;
    const processCode = b.process_type.trim();
    if (processCode !== FINISH_PROCESS_TYPE) continue;

    const use = useByLot.get(b.lot_no);
    if (!use) continue;

    const u = use.data;
    const statusCode = b.lot_status.trim();
    const organicCode = b.organic_class.trim();

    rows.push({
      id: String(b.lot_no),
      workDate: b.work_date,
      lotNo: b.lot_no,
      productNo: b.product_no,
      lotStatusCode: statusCode,
      lotStatusName: formatFactory2LotStatus(statusCode),
      lotName: b.lot_name,
      makeYear: parseOptionalInt(u.make_year),
      itemName: u.use_name,
      itemNo: u.use_no,
      count: parseOptionalInt(u.count),
      organicClassCode: organicCode,
      organicClass: formatFactory2OrganicClass(organicCode),
      unitWeight: b.unit_weight,
      unitNumber: b.unit_number,
      fractionWeight: fractionWeightTotal(b.fraction_weight, b.fraction_number)
    });
  }

  return sortFinishRows(rows);
}
