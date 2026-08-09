/**
 * 仕入振分実績（te_purchase_transfer）登録 API
 */
import { getMaterialApiBaseUrl } from "../config/api";

const base = () => `${getMaterialApiBaseUrl()}/te_purchase_transfer`;

export type PurchaseTransferUpsertResult = {
  ok: boolean;
};

export async function upsertPurchaseTransfer(body: Record<string, unknown>): Promise<PurchaseTransferUpsertResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `仕入振分実績の登録に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as PurchaseTransferUpsertResult;
  if (data.ok !== true) {
    throw new Error("仕入振分実績 API が失敗を返しました");
  }
  return data;
}
