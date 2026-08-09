/**
 * 直送先マスタ（tr_direct_shipment）CRUD API（ShipmentCorrect 相当）
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/tr_direct_shipment`;

export type TrDirectShipmentUpsertBody = {
  direct_shipment_no: number;
  direct_shipment_name: string;
  direct_shipment_kana: string | null;
  zip: string | null;
  address: string | null;
  phone_no: string | null;
  fax_no: string | null;
  display_order: number;
  remarks: string | null;
};

export type TrDirectShipmentApiResult = { ok: boolean };

export async function upsertTrDirectShipment(
  body: TrDirectShipmentUpsertBody
): Promise<TrDirectShipmentApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text || `直送先マスタの登録に失敗しました (${response.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = (await response.json()) as TrDirectShipmentApiResult;
  if (data.ok !== true) {
    throw new Error("直送先マスタ API が失敗を返しました");
  }
  return data;
}

export async function deleteTrDirectShipment(directShipmentNo: number): Promise<TrDirectShipmentApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direct_shipment_no: directShipmentNo })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `直送先マスタの削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as TrDirectShipmentApiResult;
  if (data.ok !== true) {
    throw new Error("直送先マスタ削除 API が失敗を返しました");
  }
  return data;
}

export async function refreshTrDirectShipmentRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
