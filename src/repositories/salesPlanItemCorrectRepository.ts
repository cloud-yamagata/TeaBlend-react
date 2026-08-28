/**
 * 販売計画商品マスタ（tr_sales_plan_item）CRUD API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/tr_sales_plan_item`;

export type TrSalesPlanItemUpsertBody = {
  item_no: number;
  display_order: number | null;
  display: boolean;
  remarks: string | null;
};

export type TrSalesPlanItemApiResult = { ok: boolean };

export async function upsertTrSalesPlanItem(
  body: TrSalesPlanItemUpsertBody
): Promise<TrSalesPlanItemApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text || `販売計画商品マスタの登録に失敗しました (${response.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await response.json()) as TrSalesPlanItemApiResult;
  if (data.ok !== true) {
    throw new Error("販売計画商品マスタ API が失敗を返しました");
  }
  return data;
}

export async function deleteTrSalesPlanItem(itemNo: number): Promise<TrSalesPlanItemApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_no: itemNo })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `販売計画商品マスタの削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as TrSalesPlanItemApiResult;
  if (data.ok !== true) {
    throw new Error("販売計画商品マスタ削除 API が失敗を返しました");
  }
  return data;
}

export async function refreshTrSalesPlanItemRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
