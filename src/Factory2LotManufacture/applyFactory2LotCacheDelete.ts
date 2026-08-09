/**
 * 第二工場ロット製造登録・削除時のクライアントキャッシュ更新
 *
 * 更新キー: 親ロット lot_no
 * ① te_lot_base DELETE
 * ② te_lot_use_item DELETE（親＋子ロット）
 * ③ te_lot_part DELETE（親 lot_no）
 * ④ te_lot_categorys_common DELETE（親 lot_no）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";

export function applyFactory2LotCacheDelete(
  cache: MasterEntityCache,
  parentLotNo: number
): MasterEntityCache {
  const oldParts = cache.te_lot_part.filter((p) => p.data.lot_no === parentLotNo);
  const useItemDeleteLotNos = new Set<number>([
    parentLotNo,
    ...oldParts.map((p) => p.data.part_no)
  ]);

  return {
    ...cache,
    te_lot_base: cache.te_lot_base.filter((b) => b.data.lot_no !== parentLotNo),
    te_lot_use_item: cache.te_lot_use_item.filter((u) => !useItemDeleteLotNos.has(u.data.lot_no)),
    te_lot_part: cache.te_lot_part.filter((p) => p.data.lot_no !== parentLotNo),
    te_lot_categorys_common: cache.te_lot_categorys_common.filter((c) => c.data.lot_no !== parentLotNo)
  };
}
