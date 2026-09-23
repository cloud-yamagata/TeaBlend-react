/**
 * 仕入振分実績（te_purchase_transfer）登録 / 削除 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_purchase_transfer`;

export type PurchaseTransferUpsertResult = {
  ok: boolean;
};

export type PurchaseTransferDeleteResult = {
  ok: boolean;
};

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const text = await response.text().catch(() => "");
  if (!text) return `${fallback} (${response.status})`;
  try {
    const json = JSON.parse(text) as { detail?: unknown };
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail;
  } catch {
    /* 非 JSON */
  }
  return text;
};

export async function upsertPurchaseTransfer(body: Record<string, unknown>): Promise<PurchaseTransferUpsertResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "仕入振分実績の登録に失敗しました"));
  }
  const data = (await response.json()) as PurchaseTransferUpsertResult;
  if (data.ok !== true) {
    throw new Error("仕入振分実績 API が失敗を返しました");
  }
  return data;
}

export async function deletePurchaseTransfer(body: {
  year: number;
  purchase: string;
  bid_no: string;
  result_type: string;
  transfer: string;
}): Promise<PurchaseTransferDeleteResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "仕入振分実績の削除に失敗しました"));
  }
  const data = (await response.json()) as PurchaseTransferDeleteResult;
  if (data.ok !== true) {
    throw new Error("仕入振分実績削除 API が失敗を返しました");
  }
  return data;
}

export async function fetchPurchaseTransferRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
