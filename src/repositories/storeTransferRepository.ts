/**
 * 第3工場入出庫実績（te_store_transfer）CRUD API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_store_transfer`;

export type StoreTransferCreateBody = {
  transfer_date: string;
  item_no: number;
  product_no: number;
  transfer_type: string;
  result_type: string;
  lot_no: string;
  lot_type: string;
  reason: string | null;
  store_no: number;
  store_party_name: string | null;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  transfer_quantity: number;
  unit_type: string | null;
  remarks: string | null;
};

export type StoreTransferUpdateBody = {
  transfer_no: number;
  transfer_date: string | null;
  reason: string | null;
  store_party_name: string | null;
  unit_weight: number | null;
  unit_number: number | null;
  fraction_weight: number | null;
  fraction_number: number | null;
  transfer_quantity: number;
  remarks: string | null;
};

export type StoreTransferApiResult = { ok: boolean; transfer_no?: number };

async function postJson(path: string, body: unknown, fallbackError: string): Promise<StoreTransferApiResult> {
  const response = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text || `${fallbackError} (${response.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await response.json()) as StoreTransferApiResult;
  if (data.ok !== true) {
    throw new Error(`${fallbackError}: API が失敗を返しました`);
  }
  return data;
}

export async function createStoreTransfer(body: StoreTransferCreateBody): Promise<StoreTransferApiResult> {
  return postJson("/create", body, "入出庫情報の登録に失敗しました");
}

export async function updateStoreTransfer(body: StoreTransferUpdateBody): Promise<StoreTransferApiResult> {
  return postJson("/update", body, "入出庫情報の更新に失敗しました");
}

export async function refreshStoreTransferRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
