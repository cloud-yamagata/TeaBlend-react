/**
 * 原料実績（te_material_result）登録 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_material_result`;

export type MaterialResultUpsertBody = {
  year: number;
  purchase: string;
  product_no: string;
  purchase_date: string;
  tea_rank: string;
  rank: string;
  tea_type: string | null;
  tea_life: string | null;
  organic_class: string;
  producer: string | null;
  material_name: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  remarks: string | null;
};

export type MaterialResultDeleteBody = {
  year: number;
  purchase: string;
  product_no: string;
  purchase_date: string;
  tea_rank: string;
  rank: string;
};

export type MaterialResultApiResult = { ok: boolean };

export async function upsertMaterialResult(body: MaterialResultUpsertBody): Promise<MaterialResultApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `原料実績の登録に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as MaterialResultApiResult;
  if (data.ok !== true) {
    throw new Error("原料実績 API が失敗を返しました");
  }
  return data;
}

export async function deleteMaterialResult(body: MaterialResultDeleteBody): Promise<MaterialResultApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `原料実績の削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as MaterialResultApiResult;
  if (data.ok !== true) {
    throw new Error("原料実績削除 API が失敗を返しました");
  }
  return data;
}

export async function fetchMaterialResultRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}
