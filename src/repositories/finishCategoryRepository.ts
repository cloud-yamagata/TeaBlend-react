/**
 * 仕上個別情報登録：UPSERT API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import type { FinishCategoryUpsertPayload } from "../FinishCategorys/finishCategoryEditTypes";

const base = () => `${getMaterialApiBaseUrl()}/te_lot_categorys_finish`;

export type FinishCategoryUpsertApiResult = {
  ok: boolean;
  lot_no: number;
};

export async function upsertFinishCategory(
  payload: FinishCategoryUpsertPayload
): Promise<FinishCategoryUpsertApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as FinishCategoryUpsertApiResult;
  if (data.ok !== true || !Number.isFinite(data.lot_no)) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}
