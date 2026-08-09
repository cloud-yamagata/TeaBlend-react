/**
 * 第2工場入出庫実績（te_store_transfer_fa2）CRUD API（StoreTransferFa2 相当）
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_store_transfer_fa2`;

export type StoreTransferFa2CreateBody = {
  transfer_date: string;
  lot_no: number;
  process_type: string;
  product_no: number;
  lot_name: string | null;
  transfer_type: string;
  result_type: string;
  lot_type: string;
  reason: string | null;
  unit_weight: number | null;
  unit_number: number | null;
  fraction_weight: number | null;
  fraction_number: number | null;
  transfer_quantity: number;
  unit_type: string | null;
  remarks: string | null;
};

export type StoreTransferFa2UpdateBody = {
  transfer_no: number;
  transfer_date: string | null;
  reason: string | null;
  unit_weight: number | null;
  unit_number: number | null;
  fraction_weight: number | null;
  fraction_number: number | null;
  transfer_quantity: number;
  remarks: string | null;
};

export type StoreTransferFa2ApiResult = { ok: boolean; transfer_no?: number };

async function postJson(path: string, body: unknown, fallbackError: string): Promise<StoreTransferFa2ApiResult> {
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
  const data = (await response.json()) as StoreTransferFa2ApiResult;
  if (data.ok !== true) {
    throw new Error(`${fallbackError}: API が失敗を返しました`);
  }
  return data;
}

export async function createStoreTransferFa2(
  body: StoreTransferFa2CreateBody
): Promise<StoreTransferFa2ApiResult> {
  return postJson("/create", body, "入出庫情報の登録に失敗しました");
}

export async function updateStoreTransferFa2(
  body: StoreTransferFa2UpdateBody
): Promise<StoreTransferFa2ApiResult> {
  return postJson("/update", body, "入出庫情報の更新に失敗しました");
}

export async function refreshStoreTransferFa2Rows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
