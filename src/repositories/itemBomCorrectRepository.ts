/**
 * 商品原料対照表（tr_item_bom）CRUD API（ItemBomCorrect 相当）
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/tr_item_bom`;

export type TrItemBomUpsertBody = {
  parent_item_no: number;
  child_item_no: number;
};

export type TrItemBomApiResult = { ok: boolean };

export async function upsertTrItemBom(body: TrItemBomUpsertBody): Promise<TrItemBomApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text || `商品原料対照表の登録に失敗しました (${response.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await response.json()) as TrItemBomApiResult;
  if (data.ok !== true) {
    throw new Error("商品原料対照表 API が失敗を返しました");
  }
  return data;
}

export async function deleteTrItemBom(parentItemNo: number): Promise<TrItemBomApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parent_item_no: parentItemNo })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `商品原料対照表の削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as TrItemBomApiResult;
  if (data.ok !== true) {
    throw new Error("商品原料対照表削除 API が失敗を返しました");
  }
  return data;
}

export async function refreshTrItemBomRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
