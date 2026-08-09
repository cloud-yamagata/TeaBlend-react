/**
 * 【処理概要】
 *   月次計画・商品マスタの取得と、月次計画の create/update/delete API。
 *
 * 【パラメータ仕様】
 *   - `fetchMonthlyPlans` / `fetchItems` … GET 一覧
 *   - `createMonthlyPlan` / `updateMonthlyPlan` … POST body は `Record<string, unknown>`（画面側で組み立て）
 *   - `deleteMonthlyPlans` … POST `/te_monthly_plan/delete` に `{ plans: TeMonthlyPlan[] }`
 */
import { getMonthlyApiBaseUrl } from "../config/api";
import { fetchJsonArray } from "../lib/apiFetch";
import type { TeMonthlyPlan, TrItem } from "../MonthlyPlan/types";
import { normalizeItem, normalizeMonthlyPlan } from "./recordNormalize";

export async function fetchMonthlyPlans(): Promise<TeMonthlyPlan[]> {
  const url = `${getMonthlyApiBaseUrl()}/te_monthly_plan/`;
  const raw = await fetchJsonArray(url);
  return raw.map((row) => normalizeMonthlyPlan((row ?? {}) as Record<string, unknown>));
}

export async function fetchItems(): Promise<TrItem[]> {
  const url = `${getMonthlyApiBaseUrl()}/tr_item/`;
  const raw = await fetchJsonArray(url);
  return raw.map((row) => normalizeItem((row ?? {}) as Record<string, unknown>));
}

export async function deleteMonthlyPlans(targets: TeMonthlyPlan[]): Promise<void> {
  if (targets.length === 0) {
    return;
  }
  const url = `${getMonthlyApiBaseUrl()}/te_monthly_plan/delete`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ plans: targets })
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
}

export async function createMonthlyPlan(payload: Record<string, unknown>): Promise<TeMonthlyPlan> {
  const url = `${getMonthlyApiBaseUrl()}/te_monthly_plan/create`;
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
  return normalizeMonthlyPlan(raw);
}

export async function updateMonthlyPlan(payload: Record<string, unknown>): Promise<TeMonthlyPlan> {
  const url = `${getMonthlyApiBaseUrl()}/te_monthly_plan/update`;
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
  return normalizeMonthlyPlan(raw);
}
