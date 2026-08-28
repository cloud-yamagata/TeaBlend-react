/**
 * 月次販売計画（te_monthly_sales_plan）年月単位 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { formatFetchFailureMessage } from "../lib/apiFetch";

const base = () => `${getMaterialApiBaseUrl()}/te_monthly_sales_plan`;

export type TeMonthlySalesPlanRead = {
  year: number;
  month: number;
  item_no: number;
  item_name: string;
  sales_size: number;
  remarks: string | null;
};

export type TeMonthlySalesPlanItemPayload = {
  item_no: number;
  item_name: string;
  sales_size: number;
  remarks: string | null;
};

export type TeMonthlySalesPlanMonthResult = {
  ok: boolean;
  count: number;
};

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

export async function fetchTeMonthlySalesPlan(
  year: number,
  month: number
): Promise<TeMonthlySalesPlanRead[]> {
  const url = `${base()}/?year=${encodeURIComponent(String(year))}&month=${encodeURIComponent(String(month))}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, `月次販売計画の取得に失敗しました (${response.status})`));
  }
  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error("月次販売計画 API の応答が配列ではありません");
  }
  return raw as TeMonthlySalesPlanRead[];
}

export async function upsertTeMonthlySalesPlanMonth(
  year: number,
  month: number,
  items: TeMonthlySalesPlanItemPayload[]
): Promise<TeMonthlySalesPlanMonthResult> {
  const url = `${base()}/upsert-month`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, items })
    });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, `月次販売計画の登録に失敗しました (${response.status})`));
  }
  const data = (await response.json()) as TeMonthlySalesPlanMonthResult;
  if (data.ok !== true) {
    throw new Error("月次販売計画の登録 API が失敗を返しました");
  }
  return data;
}

export async function deleteTeMonthlySalesPlanMonth(
  year: number,
  month: number
): Promise<TeMonthlySalesPlanMonthResult> {
  const url = `${base()}/delete-month`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month })
    });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, `月次販売計画の削除に失敗しました (${response.status})`));
  }
  const data = (await response.json()) as TeMonthlySalesPlanMonthResult;
  if (data.ok !== true) {
    throw new Error("月次販売計画の削除 API が失敗を返しました");
  }
  return data;
}
