import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TeLotCategorysFirepan } from "../domain/masterTableEntityModels";
import type { FirepanCategoryUpsertPayload } from "./firepanCategoryEditTypes";

export function applyFirepanCategoryCacheUpsert(
  cache: MasterEntityCache,
  payload: FirepanCategoryUpsertPayload
): MasterEntityCache {
  const lotNo = payload.lot_no;
  const existing = cache.te_lot_categorys_firepan.find((e) => e.data.lot_no === lotNo);
  const now = new Date().toISOString();

  const nextRow = TeLotCategorysFirepan.parse({
    ...payload,
    update_time: now
  });

  const nextFirepan = existing
    ? cache.te_lot_categorys_firepan.map((e) => (e.data.lot_no === lotNo ? nextRow : e))
    : [...cache.te_lot_categorys_firepan, nextRow];

  return {
    ...cache,
    te_lot_categorys_firepan: nextFirepan
  };
}
