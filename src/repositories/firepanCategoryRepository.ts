import { getMaterialApiBaseUrl } from "../config/api";
import type { FirepanCategoryUpsertPayload } from "../FirepanCategorys/firepanCategoryEditTypes";

const base = () => `${getMaterialApiBaseUrl()}/te_lot_categorys_firepan`;

export type FirepanCategoryUpsertApiResult = {
  ok: boolean;
  lot_no: number;
};

export async function upsertFirepanCategory(
  payload: FirepanCategoryUpsertPayload
): Promise<FirepanCategoryUpsertApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as FirepanCategoryUpsertApiResult;
  if (data.ok !== true || !Number.isFinite(data.lot_no)) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}
