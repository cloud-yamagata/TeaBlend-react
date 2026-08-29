/**
 * システム定数（tr_constant）CRUD API（TrConstantCorrect 相当）
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { formatFetchFailureMessage } from "../lib/apiFetch";

const base = () => `${getMaterialApiBaseUrl()}/tr_constant`;

export type TrConstantUpsertBody = {
  const_field: string;
  const_value: string;
  const_name: string;
  display_order: number | null;
  display: boolean | null;
};

export type TrConstantDeleteBody = {
  const_field: string;
  const_value: string;
};

export type TrConstantApiResult = { ok: boolean };

async function readApiError(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { detail?: unknown };
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail;
  } catch {
    /* ignore */
  }
  return text || fallback;
}

export async function upsertTrConstant(body: TrConstantUpsertBody): Promise<TrConstantApiResult> {
  const url = `${base()}/upsert`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, `システム定数の登録に失敗しました (${response.status})`));
  }
  const data = (await response.json()) as TrConstantApiResult;
  if (data.ok !== true) {
    throw new Error("システム定数 API が失敗を返しました");
  }
  return data;
}

export async function deleteTrConstant(body: TrConstantDeleteBody): Promise<TrConstantApiResult> {
  const url = `${base()}/delete`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, `システム定数の削除に失敗しました (${response.status})`));
  }
  const data = (await response.json()) as TrConstantApiResult;
  if (data.ok !== true) {
    throw new Error("システム定数削除 API が失敗を返しました");
  }
  return data;
}
