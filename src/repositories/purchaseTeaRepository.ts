/**
 * 仕入実績（te_purchase_tea）登録 / 削除 / 原料登録 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_purchase_tea`;

export type PurchaseTeaUpsertResult = {
  ok: boolean;
};

export type PurchaseTeaDeleteResult = {
  ok: boolean;
};

export type PurchaseTeaMaterialRegistResult = {
  ok: boolean;
  material_no: number;
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

export async function upsertPurchaseTea(body: Record<string, unknown>): Promise<PurchaseTeaUpsertResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "仕入実績の登録に失敗しました"));
  }
  const data = (await response.json()) as PurchaseTeaUpsertResult;
  if (data.ok !== true) {
    throw new Error("仕入実績 API が失敗を返しました");
  }
  return data;
}

export async function deletePurchaseTea(body: {
  year: number;
  purchase: string;
  bid_no: string;
}): Promise<PurchaseTeaDeleteResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "仕入実績の削除に失敗しました"));
  }
  const data = (await response.json()) as PurchaseTeaDeleteResult;
  if (data.ok !== true) {
    throw new Error("仕入実績削除 API が失敗を返しました");
  }
  return data;
}

export async function materialRegistPurchaseTea(body: {
  year: number;
  purchase: string;
  bid_no: string;
}): Promise<PurchaseTeaMaterialRegistResult> {
  const response = await fetch(`${base()}/material_regist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "原料登録に失敗しました"));
  }
  const data = (await response.json()) as PurchaseTeaMaterialRegistResult;
  if (data.ok !== true) {
    throw new Error("原料登録 API が失敗を返しました");
  }
  return data;
}

export async function fetchPurchaseTeaRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
