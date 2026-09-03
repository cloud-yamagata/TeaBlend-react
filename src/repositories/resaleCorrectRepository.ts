/**
 * 転売先マスタ（tr_resale）CRUD API（ResaleCorrect 相当）
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/tr_resale`;

export type TrResaleUpsertBody = {
  resale: string;
  rate: number;
  postage: number;
  limit_price: number;
  fixed_price: number;
  calc_type: number;
  remarks: string | null;
};

export type TrResaleApiResult = { ok: boolean };

export async function upsertTrResale(body: TrResaleUpsertBody): Promise<TrResaleApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text || `転売先マスタの登録に失敗しました (${response.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await response.json()) as TrResaleApiResult;
  if (data.ok !== true) {
    throw new Error("転売先マスタ API が失敗を返しました");
  }
  return data;
}

export async function deleteTrResale(resale: string): Promise<TrResaleApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resale })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `転売先マスタの削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as TrResaleApiResult;
  if (data.ok !== true) {
    throw new Error("転売先マスタ削除 API が失敗を返しました");
  }
  return data;
}

export async function refreshTrResaleRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
