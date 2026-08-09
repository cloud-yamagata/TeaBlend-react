/**
 * 第二工場ロット製造登録・変更時のクライアントキャッシュ更新
 *
 * 更新キー: 親ロット lot_no（一覧選択行）
 * ① te_lot_base UPDATE
 * ①' te_lot_categorys_common UPDATE（同一 lot_no）
 * ② te_lot_use_item DELETE（親＋旧子ロット）
 * ③ te_lot_part DELETE（親 lot_no）
 * ④ te_lot_use_item INSERT（親＋子ロット）
 * ⑤ te_lot_part INSERT
 */
import {
  TeLotBase,
  TeLotPart,
  TeLotUseItem,
  type MasterEntityCache
} from "../domain/masterTableEntityModels";
import { TeLotCategorysCommon } from "../domain/wideLotCategoryEntities";
import type { Factory2LotUpdatePayload } from "./collectFactory2LotEditPayload";

const nowIso = (): string => new Date().toISOString();

const parseUseQuantity = (text: string): number | null => {
  const t = text.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
};

const resolveUseNo = (cache: MasterEntityCache, lotNo: number): number => {
  const existing = cache.te_lot_use_item.find((u) => u.data.lot_no === lotNo);
  if (existing) return existing.data.use_no;
  const base = cache.te_lot_base.find((b) => b.data.lot_no === lotNo);
  return base?.data.product_no ?? lotNo;
};

export function applyFactory2LotCacheUpdate(
  cache: MasterEntityCache,
  payload: Factory2LotUpdatePayload
): MasterEntityCache {
  const { parentLotNo, organic_class: organicClass, baseFields, categoryFields, partRows } = payload;
  const organic = (organicClass || "C").trim().toUpperCase();
  const organicCode = organic === "A" || organic === "B" || organic === "C" ? organic : "C";

  const oldParts = cache.te_lot_part.filter((p) => p.data.lot_no === parentLotNo);
  const oldChildLotNos = oldParts.map((p) => p.data.part_no);
  const useItemDeleteLotNos = new Set<number>([parentLotNo, ...oldChildLotNos]);

  const parentUseNo = resolveUseNo(cache, parentLotNo);
  const parentBase = cache.te_lot_base.find((b) => b.data.lot_no === parentLotNo);
  if (!parentBase) {
    return cache;
  }

  const b0 = parentBase.data;
  const updatedBase = TeLotBase.parse({
    lot_no: b0.lot_no,
    process_type: b0.process_type,
    product_no: b0.product_no,
    lot_status: b0.lot_status,
    lot_name: baseFields.lot_name,
    work_date: baseFields.work_date,
    organic_class: organicCode,
    unit_weight: baseFields.unit_weight,
    unit_number: baseFields.unit_number,
    fraction_weight: baseFields.fraction_weight,
    fraction_number: baseFields.fraction_number,
    remarks: baseFields.remarks,
    update_time: nowIso()
  });

  const remainingUseItems = cache.te_lot_use_item.filter((u) => !useItemDeleteLotNos.has(u.data.lot_no));
  const remainingParts = cache.te_lot_part.filter((p) => p.data.lot_no !== parentLotNo);

  const insertedUseItems = [
    TeLotUseItem.parse({
      lot_no: parentLotNo,
      use_no: parentUseNo,
      use_name: baseFields.use_name,
      make_year: baseFields.make_year || null,
      count: baseFields.count || null
    })
  ];

  const insertedPartEntities: TeLotPart[] = [];

  for (const row of partRows) {
    const childLotNo = Number(row.lotNo);
    const partNo = Number(row.partNo) || childLotNo;
    if (!Number.isFinite(childLotNo) || !Number.isFinite(partNo)) continue;

    insertedUseItems.push(
      TeLotUseItem.parse({
        lot_no: childLotNo,
        use_no: resolveUseNo(cache, childLotNo),
        use_name: row.partName.trim() || null,
        make_year: row.makeYear.trim() || null,
        count: row.count.trim() || null
      })
    );

    insertedPartEntities.push(
      TeLotPart.parse({
        lot_no: parentLotNo,
        part_no: partNo,
        use_quantity: parseUseQuantity(row.useQuantity),
        remarks: row.remarks.trim() || null,
        update_time: nowIso()
      })
    );
  }

  const nextBase = cache.te_lot_base.map((b) => (b.data.lot_no === parentLotNo ? updatedBase : b));

  const existingCategory = cache.te_lot_categorys_common.find((c) => c.data.lot_no === parentLotNo);
  const c0 = existingCategory?.data;
  const updatedCategory = TeLotCategorysCommon.parse({
    lot_no: parentLotNo,
    temperature: categoryFields.temperature,
    humidity: categoryFields.humidity,
    work_start_hh: categoryFields.work_start_hh,
    work_start_mm: categoryFields.work_start_mm,
    work_end_hh: categoryFields.work_end_hh,
    work_end_mm: categoryFields.work_end_mm,
    work_before_cleaning_start_hh: categoryFields.work_before_cleaning_start_hh,
    work_before_cleaning_start_mm: categoryFields.work_before_cleaning_start_mm,
    work_before_cleaning_end_hh: categoryFields.work_before_cleaning_end_hh,
    work_before_cleaning_end_mm: categoryFields.work_before_cleaning_end_mm,
    work_end_cleaning_start_hh: categoryFields.work_end_cleaning_start_hh,
    work_end_cleaning_start_mm: categoryFields.work_end_cleaning_start_mm,
    work_end_cleaning_end_hh: categoryFields.work_end_cleaning_end_hh,
    work_end_cleaning_end_mm: categoryFields.work_end_cleaning_end_mm,
    work_before_cleaning_chk: categoryFields.work_before_cleaning_chk,
    work_after_cleaning_chk: categoryFields.work_after_cleaning_chk,
    device_chk: categoryFields.device_chk,
    operation_chk: categoryFields.operation_chk,
    rest_chk: categoryFields.rest_chk,
    magnet_cleaning_chk: categoryFields.magnet_cleaning_chk,
    use_device_unit1_chk: categoryFields.use_device_unit1_chk,
    use_device_unit2_chk: categoryFields.use_device_unit2_chk,
    use_device_unit3_chk: categoryFields.use_device_unit3_chk,
    packing_case1_chk: categoryFields.packing_case1_chk,
    packing_case2_chk: categoryFields.packing_case2_chk,
    remarks: c0?.remarks ?? null,
    update_time: nowIso()
  });

  const nextCategory = existingCategory
    ? cache.te_lot_categorys_common.map((c) => (c.data.lot_no === parentLotNo ? updatedCategory : c))
    : [...cache.te_lot_categorys_common, updatedCategory];

  return {
    ...cache,
    te_lot_base: nextBase,
    te_lot_categorys_common: nextCategory,
    te_lot_use_item: [...remainingUseItems, ...insertedUseItems],
    te_lot_part: [...remainingParts, ...insertedPartEntities]
  };
}
