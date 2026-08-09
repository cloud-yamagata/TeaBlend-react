/**
 * 商品マスタ（tr_item）CRUD API（ItemCorrect 相当）
 */
import { getMonthlyApiBaseUrl } from "../config/api";
import { fetchItems } from "./monthlyPlanRepository";
import type { TrItem } from "../MonthlyPlan/types";

const base = () => `${getMonthlyApiBaseUrl()}/tr_item`;

export type TrItemUpsertBody = {
  item_no: number;
  system_class: string;
  organic_class: string;
  item_group_no: number;
  item_name: string;
  jan_code: string;
  package_size: number;
  display_order: number;
  display: boolean;
  remarks: string | null;
};

export type TrItemApiResult = { ok: boolean };

export async function upsertTrItem(body: TrItemUpsertBody): Promise<TrItemApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text || `商品マスタの登録に失敗しました (${response.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await response.json()) as TrItemApiResult;
  if (data.ok !== true) {
    throw new Error("商品マスタ API が失敗を返しました");
  }
  return data;
}

export async function deleteTrItem(itemNo: number): Promise<TrItemApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_no: itemNo })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `商品マスタの削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as TrItemApiResult;
  if (data.ok !== true) {
    throw new Error("商品マスタ削除 API が失敗を返しました");
  }
  return data;
}

export async function refreshTrItems(): Promise<TrItem[]> {
  return fetchItems();
}
