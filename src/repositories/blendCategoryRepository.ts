/**
 * 配合個別情報登録：UPSERT API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import type { BlendCategoryUpsertPayload } from "../BlendCategorys/blendCategoryEditTypes";

const base = () => `${getMaterialApiBaseUrl()}/te_lot_categorys_blend`;

export type BlendCategoryUpsertApiResult = {
  ok: boolean;
  lot_no: number;
};

export async function upsertBlendCategory(
  payload: BlendCategoryUpsertPayload
): Promise<BlendCategoryUpsertApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as BlendCategoryUpsertApiResult;
  if (data.ok !== true || !Number.isFinite(data.lot_no)) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}
