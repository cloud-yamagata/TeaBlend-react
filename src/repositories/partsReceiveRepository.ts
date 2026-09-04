/**
 * 仕上品受入 API（WPF PartsReceive 相当）
 *
 * GET  /parts_receive/stocks
 * POST /parts_receive/receive
 */
import { getMaterialApiBaseUrl } from "../config/api";

export type PartsReceiveStockDto = {
  product_date: string | null;
  item_no: number;
  product_no: number;
  product_name: string | null;
  make_year: string | null;
  count: string | null;
  product_quantity: number;
  factory2_stock: number;
  factory3_stock: number;
};

export type PartsReceiveReceiveBody = {
  item_no: number;
  product_no: number;
  transfer_quantity: number;
  transfer_date: string;
  store_no: 2 | 3;
};

const base = () => `${getMaterialApiBaseUrl()}/parts_receive`;

const parseApiError = (text: string, fallback: string): string => {
  let message = text || fallback;
  try {
    const errJson = JSON.parse(text) as { detail?: string | { msg?: string }[]; message?: string };
    if (typeof errJson.detail === "string" && errJson.detail.trim()) {
      message = errJson.detail;
    } else if (Array.isArray(errJson.detail) && errJson.detail.length > 0) {
      const first = errJson.detail[0];
      if (typeof first === "object" && first && typeof first.msg === "string") {
        message = first.msg;
      }
    } else if (typeof errJson.message === "string" && errJson.message.trim()) {
      message = errJson.message;
    }
  } catch {
    // keep text
  }
  return message;
};

export async function fetchPartsReceiveStocks(): Promise<PartsReceiveStockDto[]> {
  const response = await fetch(`${base()}/stocks`);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseApiError(text, `仕上品在庫の取得に失敗しました (${response.status})`));
  }
  if (!text) return [];
  try {
    const json = JSON.parse(text) as unknown;
    return Array.isArray(json) ? (json as PartsReceiveStockDto[]) : [];
  } catch {
    throw new Error(`仕上品在庫 API の応答を解析できません: ${text}`);
  }
}

export async function receivePartsReceive(body: PartsReceiveReceiveBody): Promise<void> {
  const response = await fetch(`${base()}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseApiError(text, `仕上品受入の登録に失敗しました (${response.status})`));
  }
  if (!text) return;
  let json: { ok?: boolean; message?: string };
  try {
    json = JSON.parse(text) as { ok?: boolean; message?: string };
  } catch {
    throw new Error(`仕上品受入 API の応答を解析できません: ${text}`);
  }
  if (json.ok === false) {
    throw new Error(
      typeof json.message === "string" && json.message.trim()
        ? json.message
        : "受入 API が失敗を返しました"
    );
  }
}
