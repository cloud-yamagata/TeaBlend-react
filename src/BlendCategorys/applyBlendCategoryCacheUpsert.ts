import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TeLotCategorysBlend } from "../domain/masterTableEntityModels";
import type { BlendCategoryUpsertPayload } from "./blendCategoryEditTypes";

/** te_lot_categorys_blend UPSERT 後のキャッシュ更新 */
export function applyBlendCategoryCacheUpsert(
  cache: MasterEntityCache,
  payload: BlendCategoryUpsertPayload
): MasterEntityCache {
  const lotNo = payload.lot_no;
  const existing = cache.te_lot_categorys_blend.find((e) => e.data.lot_no === lotNo);
  const now = new Date().toISOString();

  const nextRow = TeLotCategorysBlend.parse({
    lot_no: lotNo,
    sensual_test_color: payload.sensual_test_color,
    sensual_test_taste: payload.sensual_test_taste,
    sensual_test_aroma: payload.sensual_test_aroma,
    remarks: payload.remarks,
    update_time: now
  });

  const nextBlend = existing
    ? cache.te_lot_categorys_blend.map((e) => (e.data.lot_no === lotNo ? nextRow : e))
    : [...cache.te_lot_categorys_blend, nextRow];

  return {
    ...cache,
    te_lot_categorys_blend: nextBlend
  };
}
