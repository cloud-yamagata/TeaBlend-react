/**
 * 一括変更 … te_purchase_tea キャッシュ更新（フロント側）
 */
import { atom } from "jotai";
import { TePurchaseTea, type MasterEntityCache, type TePurchaseTeaData } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { purchaseTtransferRowId } from "./buildPurchaseTtransferList";
import type { PurchaseTtransferEditForm } from "./purchaseTtransferEditForm";

export type BulkUpdatePurchaseTeaPatch = Partial<
  Pick<
    TePurchaseTeaData,
    "variety" | "tea_life" | "grade" | "tea_type" | "tea_rank" | "field_no" | "target" | "target_plan"
  >
>;

/** チェック済み項目のみパッチを組み立て */
export function buildBulkUpdatePatchFromForm(form: PurchaseTtransferEditForm): BulkUpdatePurchaseTeaPatch {
  const patch: BulkUpdatePurchaseTeaPatch = {};
  if (form.isVarietyCheck) patch.variety = form.variety.trim() || null;
  if (form.isTeaLifeCheck) patch.tea_life = form.teaLife.trim() || null;
  if (form.isGradeCheck) patch.grade = form.grade.trim() || null;
  if (form.isTeaTypeCheck) patch.tea_type = form.teaType.trim() || null;
  if (form.isTeaRankCheck) patch.tea_rank = form.teaRank.trim() || null;
  if (form.isFieldNoCheck) patch.field_no = form.fieldNo.trim() || null;
  if (form.isTargetCheck) patch.target = form.target.trim() || null;
  if (form.isTargetPlanCheck) patch.target_plan = form.targetPlan.trim() || null;
  return patch;
}

export function applyBulkUpdateToPurchaseTeaCache(
  cache: MasterEntityCache,
  targetIds: ReadonlySet<string>,
  patch: BulkUpdatePurchaseTeaPatch
): { nextCache: MasterEntityCache; updatedCount: number } {
  if (targetIds.size === 0 || Object.keys(patch).length === 0) {
    return { nextCache: cache, updatedCount: 0 };
  }

  const now = new Date().toISOString();
  let updatedCount = 0;

  const te_purchase_tea = cache.te_purchase_tea.map((entity) => {
    const d = entity.data;
    const id = purchaseTtransferRowId(d.year, d.purchase, d.bid_no);
    if (!targetIds.has(id)) return entity;

    updatedCount += 1;
    const merged: Record<string, unknown> = {
      ...d,
      ...patch,
      update_time: now
    };
    return TePurchaseTea.parse(merged);
  });

  return {
    nextCache: { ...cache, te_purchase_tea },
    updatedCount
  };
}

export type ApplyBulkUpdatePurchaseTeaParams = {
  form: PurchaseTtransferEditForm;
  targetIds: ReadonlySet<string>;
};

export function purchaseTeaDataToUpsertBody(d: TePurchaseTeaData): Record<string, unknown> {
  return {
    year: d.year,
    purchase: d.purchase,
    bid_no: d.bid_no,
    purchase_date: d.purchase_date,
    variety: d.variety,
    tea_life: d.tea_life,
    grade: d.grade,
    tea_type: d.tea_type,
    tea_rank: d.tea_rank,
    field_no: d.field_no,
    producer: d.producer,
    cost: d.cost,
    unit_weight: d.unit_weight,
    unit_number: d.unit_number,
    fraction_weight: d.fraction_weight,
    fraction_number: d.fraction_number,
    discount: d.discount,
    target: d.target,
    target_plan: d.target_plan,
    lot_no: d.lot_no,
    remarks: d.remarks
  };
}

/** チェック済み項目を反映した upsert ボディを対象行ごとに組み立てる */
export function buildBulkUpdateUpsertBodies(
  cache: MasterEntityCache,
  targetIds: ReadonlySet<string>,
  patch: BulkUpdatePurchaseTeaPatch
): Record<string, unknown>[] {
  if (targetIds.size === 0 || Object.keys(patch).length === 0) return [];
  const bodies: Record<string, unknown>[] = [];
  for (const entity of cache.te_purchase_tea) {
    const d = entity.data;
    const id = purchaseTtransferRowId(d.year, d.purchase, d.bid_no);
    if (!targetIds.has(id)) continue;
    bodies.push(purchaseTeaDataToUpsertBody({ ...d, ...patch }));
  }
  return bodies;
}

/** 一括変更をマスタキャッシュへ反映 */
export const applyBulkUpdatePurchaseTeaCacheAtom = atom(
  null,
  (get, set, { form, targetIds }: ApplyBulkUpdatePurchaseTeaParams) => {
    const patch = buildBulkUpdatePatchFromForm(form);
    const { nextCache, updatedCount } = applyBulkUpdateToPurchaseTeaCache(get(masterEntityCacheAtom), targetIds, patch);
    set(masterEntityCacheAtom, nextCache);
    return updatedCount;
  }
);
