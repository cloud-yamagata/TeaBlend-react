import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TeLotCategorysFinish } from "../domain/wideLotCategoryEntities";
import type { FinishCategoryUpsertPayload } from "./finishCategoryEditTypes";

/** te_lot_categorys_finish UPSERT 後のキャッシュ更新 */
export function applyFinishCategoryCacheUpsert(
  cache: MasterEntityCache,
  payload: FinishCategoryUpsertPayload
): MasterEntityCache {
  const lotNo = payload.lot_no;
  const existing = cache.te_lot_categorys_finish.find((e) => e.data.lot_no === lotNo);
  const now = new Date().toISOString();

  const nextRow = TeLotCategorysFinish.parse({
    ...payload,
    update_time: now
  });

  const nextFinish = existing
    ? cache.te_lot_categorys_finish.map((e) => (e.data.lot_no === lotNo ? nextRow : e))
    : [...cache.te_lot_categorys_finish, nextRow];

  return {
    ...cache,
    te_lot_categorys_finish: nextFinish
  };
}
