/**
 * 仕上品仕入登録／更新 API
 *
 * POST /material_purchase/create
 *  - te_material_purchase / te_store_transfer / te_lot を同一トランザクションで登録
 * POST /material_purchase/update
 *  - te_material_purchase のみ更新（te_store_transfer / te_lot は更新しない）
 */
import { getMaterialApiBaseUrl } from "../config/api";

export type MaterialPurchaseCreateBody = {
  purchase_date: string;
  item_no: number;
  item_name: string;
  purchase_lot_no: string;
  purchase_quantity: number;
  supplier: string;
};

export type MaterialPurchaseUpdateBody = {
  purchase_no: number;
  purchase_date: string;
  item_no: number;
  item_name: string;
  purchase_lot_no: string;
  purchase_quantity: number;
  supplier: string;
};

export type MaterialPurchaseCreateResult = {
  purchase_no: number;
  transfer_no?: number | null;
  lot_no?: number | null;
};

export type MaterialPurchaseUpdateResult = {
  purchase_no: number;
};

const base = () => `${getMaterialApiBaseUrl()}/material_purchase`;

const parseApiError = (text: string, fallback: string): string => {
  let message = text || fallback;
  try {
    const errJson = JSON.parse(text) as { detail?: string; message?: string };
    if (typeof errJson.detail === "string" && errJson.detail.trim()) message = errJson.detail;
    else if (typeof errJson.message === "string" && errJson.message.trim()) message = errJson.message;
  } catch {
    // keep text
  }
  return message;
};

const parseJson = (text: string): Record<string, unknown> => {
  if (!text) {
    throw new Error("仕上品仕入 API が空の応答を返しました");
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`仕上品仕入 API の応答を解析できません: ${text}`);
  }
};

const parsePurchaseNo = (json: Record<string, unknown>): number => {
  const direct = Number(json.purchase_no);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const data = json.data;
  if (data && typeof data === "object") {
    const nested = Number((data as Record<string, unknown>).purchase_no);
    if (Number.isFinite(nested) && nested > 0) return nested;
  }

  const productNo = Number(json.product_no);
  if (Number.isFinite(productNo) && productNo > 0) return productNo;

  return 0;
};

export async function createMaterialPurchase(
  body: MaterialPurchaseCreateBody
): Promise<MaterialPurchaseCreateResult> {
  const response = await fetch(`${base()}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      transfer_type: "1",
      result_type: "4",
      lot_type: "2",
      reason: "仕上品仕入",
      store_no: 3,
      unit_type: "Kg",
      process_type: "08",
      process_name: "仕上品仕入"
    })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseApiError(text, `仕上品仕入の登録に失敗しました (${response.status})`));
  }

  const json = parseJson(text);
  if (json.ok === false) {
    throw new Error(
      typeof json.message === "string" && json.message.trim()
        ? json.message
        : "仕上品仕入 API が失敗を返しました"
    );
  }

  const purchaseNo = parsePurchaseNo(json);
  if (!Number.isFinite(purchaseNo) || purchaseNo <= 0) {
    throw new Error("仕上品仕入 API の purchase_no が不正です");
  }

  const transferNo = Number(json.transfer_no);
  const lotNo = Number(json.lot_no);

  return {
    purchase_no: purchaseNo,
    transfer_no: Number.isFinite(transferNo) && transferNo > 0 ? transferNo : null,
    lot_no: Number.isFinite(lotNo) && lotNo > 0 ? lotNo : null
  };
}

export async function updateMaterialPurchase(
  body: MaterialPurchaseUpdateBody
): Promise<MaterialPurchaseUpdateResult> {
  const response = await fetch(`${base()}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseApiError(text, `仕上品仕入の更新に失敗しました (${response.status})`));
  }

  const json = parseJson(text);
  if (json.ok === false) {
    throw new Error(
      typeof json.message === "string" && json.message.trim()
        ? json.message
        : "仕上品仕入更新 API が失敗を返しました"
    );
  }

  const purchaseNo = parsePurchaseNo(json);
  if (!Number.isFinite(purchaseNo) || purchaseNo <= 0) {
    throw new Error("仕上品仕入更新 API の purchase_no が不正です");
  }

  return { purchase_no: purchaseNo };
}
