/**
 * 第1工場生産実績（te_factory1_result）登録 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchMasterTableList } from "./masterTableRepository";

const base = () => `${getMaterialApiBaseUrl()}/te_factory1_result`;

export type Factory1ResultUpsertBody = {
  lot_no: string;
  year: number;
  work_date: string;
  variety: string;
  tea_life: string;
  grade: string;
  tea_rank: string;
  field_no: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  target: string | null;
  remarks: string | null;
};

export type Factory1ResultApiResult = { ok: boolean };

export async function upsertFactory1Result(body: Factory1ResultUpsertBody): Promise<Factory1ResultApiResult> {
  const response = await fetch(`${base()}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `第1工場生産実績の登録に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as Factory1ResultApiResult;
  if (data.ok !== true) {
    throw new Error("第1工場生産実績 API が失敗を返しました");
  }
  return data;
}

export async function deleteFactory1Result(lotNo: string): Promise<Factory1ResultApiResult> {
  const response = await fetch(`${base()}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lot_no: lotNo })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `第1工場生産実績の削除に失敗しました (${response.status})`);
  }
  const data = (await response.json()) as Factory1ResultApiResult;
  if (data.ok !== true) {
    throw new Error("第1工場生産実績削除 API が失敗を返しました");
  }
  return data;
}

export async function fetchFactory1ResultRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${base()}/`);
}

export async function fetchFactory1TransferRows(): Promise<Record<string, unknown>[]> {
  return fetchMasterTableList(`${getMaterialApiBaseUrl()}/te_factory1_transfer/`);
}
