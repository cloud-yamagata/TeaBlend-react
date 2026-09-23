/**
 * 第二工場ロット製造登録・在庫確定時のクライアントキャッシュ更新
 * te_lot_base.lot_status を確定(3)にする。
 */
import { TeLotBase, type MasterEntityCache } from "../domain/masterTableEntityModels";

const nowIso = (): string => new Date().toISOString();

export function applyFactory2LotCacheConfirmStock(
  cache: MasterEntityCache,
  lotNo: number
): MasterEntityCache {
  const parentBase = cache.te_lot_base.find((b) => b.data.lot_no === lotNo);
  if (!parentBase) return cache;

  const b0 = parentBase.data;
  const updatedBase = TeLotBase.parse({
    lot_no: b0.lot_no,
    process_type: b0.process_type,
    product_no: b0.product_no,
    lot_status: "3",
    lot_name: b0.lot_name,
    work_date: b0.work_date,
    organic_class: b0.organic_class,
    unit_weight: b0.unit_weight,
    unit_number: b0.unit_number,
    fraction_weight: b0.fraction_weight,
    fraction_number: b0.fraction_number,
    remarks: b0.remarks,
    update_time: nowIso()
  });

  return {
    ...cache,
    te_lot_base: cache.te_lot_base.map((b) => (b.data.lot_no === lotNo ? updatedBase : b))
  };
}
