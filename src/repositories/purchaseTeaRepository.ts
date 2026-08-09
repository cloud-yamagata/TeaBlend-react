/**
 * 仕入実績（te_purchase_tea）登録 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_purchase_tea`;

export type PurchaseTeaUpsertResult = {
  ok: boolean;
};

export async function upsertPurchaseTea(body: Record<string, unknown>): Promise<PurchaseTeaUpsertResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `仕入実績の登録に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as PurchaseTeaUpsertResult;
  if (data.ok !== true) {
    throw new Error("仕入実績 API が失敗を返しました");
  }
  return data;
}

export async function fetchPurchaseTeaRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
