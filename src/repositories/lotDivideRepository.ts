/**
 * ロット分割 MaterialRegist API
 */
import { getMaterialApiBaseUrl } from "../config/api";

export type LotDivideMaterialRegistBody = {
  lot_no: number;
  process_type: string;
  product_no: number;
  lot_name: string | null;
  item_no: number;
  item_name: string | null;
  organic_class: string;
  make_year: string | null;
  count: string | null;
  factory2_stock: number;
  divide_type: "1" | "2";
  divide_date: string;
  divide_quantity: number;
  divide_lot_name: string;
  reason: string | null;
  remarks: string | null;
};

export type LotDivideMaterialRegistResult = {
  ok: boolean;
  serial_no: number;
  message: string;
};

const base = () => `${getMaterialApiBaseUrl()}/lot_divide`;

const parseApiError = (text: string, fallback: string): string => {
  let message = text || fallback;
  try {
    const errJson = JSON.parse(text) as { detail?: string | { msg?: string }[]; message?: string };
    if (typeof errJson.detail === "string" && errJson.detail.trim()) message = errJson.detail;
    else if (Array.isArray(errJson.detail) && errJson.detail[0] && typeof errJson.detail[0] === "object") {
      const msg = (errJson.detail[0] as { msg?: string }).msg;
      if (msg) message = msg;
    } else if (typeof errJson.message === "string" && errJson.message.trim()) message = errJson.message;
  } catch {
    // keep
  }
  return message;
};

export async function materialRegistLotDivide(
  body: LotDivideMaterialRegistBody
): Promise<LotDivideMaterialRegistResult> {
  const response = await fetch(`${base()}/material_regist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseApiError(text, `ロット分割に失敗しました (${response.status})`));
  }
  const json = JSON.parse(text) as LotDivideMaterialRegistResult;
  if (!json.ok || !json.serial_no) {
    throw new Error(json.message || "ロット分割 API が失敗を返しました");
  }
  return json;
}
