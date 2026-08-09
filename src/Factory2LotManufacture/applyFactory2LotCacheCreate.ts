/**
 * 第二工場ロット製造登録・新規登録時のクライアントキャッシュ更新
 *
 * ① te_lot_base INSERT
 * ② te_lot_use_item INSERT（親＋子）
 * ③ te_lot_part INSERT
 * ④ te_lot_categorys_common INSERT
 */
import {
  TeLotBase,
  TeLotPart,
  TeLotUseItem,
  type MasterEntityCache
} from "../domain/masterTableEntityModels";
import { TeLotCategorysCommon } from "../domain/wideLotCategoryEntities";
import type { Factory2LotCreatePayload } from "./collectFactory2LotEditPayload";

export type Factory2LotCreateResult = {
  lot_no: number;
  product_no: number;
};

const nowIso = (): string => new Date().toISOString();

const resolveUseNo = (cache: MasterEntityCache, lotNo: number): number => {
  const existing = cache.te_lot_use_item.find((u) => u.data.lot_no === lotNo);
  if (existing) return existing.data.use_no;
  const base = cache.te_lot_base.find((b) => b.data.lot_no === lotNo);
  return base?.data.product_no ?? lotNo;
};

const parseUseQuantity = (text: string): number | null => {
  const t = text.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
};

export function applyFactory2LotCacheCreate(
  cache: MasterEntityCache,
  result: Factory2LotCreateResult,
  payload: Factory2LotCreatePayload
): MasterEntityCache {
  const { lot_no: parentLotNo, product_no: productNo } = result;
  const bf = payload.baseFields;
  const processType = payload.process_type.trim();
  const organic = payload.organic_class.trim().toUpperCase() || "C";

  const newBase = TeLotBase.parse({
    lot_no: parentLotNo,
    process_type: processType,
    product_no: productNo,
    lot_status: "1",
    lot_name: bf.lot_name,
    work_date: bf.work_date,
    organic_class: organic,
    unit_weight: bf.unit_weight,
    unit_number: bf.unit_number,
    fraction_weight: bf.fraction_weight,
    fraction_number: bf.fraction_number,
    remarks: bf.remarks,
    update_time: nowIso()
  });

  const insertedUseItems = [
    TeLotUseItem.parse({
      lot_no: parentLotNo,
      use_no: productNo,
      use_name: bf.use_name || null,
      make_year: bf.make_year || null,
      count: bf.count || null
    })
  ];

  const insertedParts: TeLotPart[] = [];

  for (const row of payload.partRows) {
    const childLotNo = Number(row.lotNo);
    const partNo = Number(row.partNo) || childLotNo;
    if (!Number.isFinite(childLotNo) || !Number.isFinite(partNo)) continue;

    const existingChildUse = cache.te_lot_use_item.find((u) => u.data.lot_no === childLotNo);
    if (existingChildUse) {
      existingChildUse.data.use_name = row.partName.trim() || null;
      existingChildUse.data.make_year = row.makeYear.trim() || null;
      existingChildUse.data.count = row.count.trim() || null;
    } else {
      insertedUseItems.push(
        TeLotUseItem.parse({
          lot_no: childLotNo,
          use_no: resolveUseNo(cache, childLotNo),
          use_name: row.partName.trim() || null,
          make_year: row.makeYear.trim() || null,
          count: row.count.trim() || null
        })
      );
    }

    insertedParts.push(
      TeLotPart.parse({
        lot_no: parentLotNo,
        part_no: partNo,
        use_quantity: parseUseQuantity(row.useQuantity),
        remarks: row.remarks.trim() || null,
        update_time: nowIso()
      })
    );
  }

  const cf = payload.categoryFields;
  const newCategory = TeLotCategorysCommon.parse({
    lot_no: parentLotNo,
    temperature: cf.temperature,
    humidity: cf.humidity,
    work_start_hh: cf.work_start_hh,
    work_start_mm: cf.work_start_mm,
    work_end_hh: cf.work_end_hh,
    work_end_mm: cf.work_end_mm,
    work_before_cleaning_start_hh: cf.work_before_cleaning_start_hh,
    work_before_cleaning_start_mm: cf.work_before_cleaning_start_mm,
    work_before_cleaning_end_hh: cf.work_before_cleaning_end_hh,
    work_before_cleaning_end_mm: cf.work_before_cleaning_end_mm,
    work_end_cleaning_start_hh: cf.work_end_cleaning_start_hh,
    work_end_cleaning_start_mm: cf.work_end_cleaning_start_mm,
    work_end_cleaning_end_hh: cf.work_end_cleaning_end_hh,
    work_end_cleaning_end_mm: cf.work_end_cleaning_end_mm,
    work_before_cleaning_chk: cf.work_before_cleaning_chk,
    work_after_cleaning_chk: cf.work_after_cleaning_chk,
    device_chk: cf.device_chk,
    operation_chk: cf.operation_chk,
    rest_chk: cf.rest_chk,
    magnet_cleaning_chk: cf.magnet_cleaning_chk,
    use_device_unit1_chk: cf.use_device_unit1_chk,
    use_device_unit2_chk: cf.use_device_unit2_chk,
    use_device_unit3_chk: cf.use_device_unit3_chk,
    packing_case1_chk: cf.packing_case1_chk,
    packing_case2_chk: cf.packing_case2_chk,
    remarks: null,
    update_time: nowIso()
  });

  return {
    ...cache,
    te_lot_base: [...cache.te_lot_base, newBase],
    te_lot_use_item: [...cache.te_lot_use_item, ...insertedUseItems],
    te_lot_part: [...cache.te_lot_part, ...insertedParts],
    te_lot_categorys_common: [...cache.te_lot_categorys_common, newCategory]
  };
}
