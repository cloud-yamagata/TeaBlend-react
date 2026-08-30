/**
 * ブレンドロット（te_blend_lot）の取得と create/update/delete API。
 */
import { getMonthlyApiBaseUrl } from "../config/api";
import { fetchJsonArray } from "../lib/apiFetch";
import type { TeBlendLot } from "../BlendLot/types";
import { normalizeBlendLot } from "./recordNormalize";

export async function fetchBlendLots(): Promise<TeBlendLot[]> {
  const url = `${getMonthlyApiBaseUrl()}/te_blend_lot/`;
  const raw = await fetchJsonArray(url);
  return raw.map((row) => normalizeBlendLot((row ?? {}) as Record<string, unknown>));
}

export async function deleteBlendLots(targets: TeBlendLot[]): Promise<void> {
  if (targets.length === 0) {
    return;
  }
  const url = `${getMonthlyApiBaseUrl()}/te_blend_lot/delete`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ lots: targets })
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
}

export async function createBlendLot(payload: Record<string, unknown>): Promise<TeBlendLot> {
  const url = `${getMonthlyApiBaseUrl()}/te_blend_lot/create`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return normalizeBlendLot(raw);
}

export async function updateBlendLot(payload: Record<string, unknown>): Promise<TeBlendLot> {
  const url = `${getMonthlyApiBaseUrl()}/te_blend_lot/update`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return normalizeBlendLot(raw);
}

export type BlendLotConfirmStockApiResult = {
  ok: boolean;
  product_no: number;
  transfer_nos: number[];
  lot_status: string;
};

export async function confirmBlendLotStock(
  body: { product_no: number }
): Promise<BlendLotConfirmStockApiResult> {
  const url = `${getMonthlyApiBaseUrl()}/te_blend_lot/confirm_stock`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as BlendLotConfirmStockApiResult;
  if (
    data.ok !== true ||
    !Number.isFinite(data.product_no) ||
    !Array.isArray(data.transfer_nos) ||
    data.transfer_nos.length < 1 ||
    data.transfer_nos.some((no) => !Number.isFinite(no))
  ) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}
