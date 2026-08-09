/**
 * 【処理概要】
 *   フロントから呼び出す FastAPI のベース URL を解決する。
 *   実行時に api-targets.yaml の選択（localStorage）があればそれを優先する。
 *
 * 【解決順】
 *   1. 明示選択された接続先の baseUrl
 *   2. 本番ビルドかつ候補読込済み: YAML defaultId（本社）
 *   3. 環境変数 VITE_API_*（開発時は /teablend-api プロキシ等）
 *   4. http://127.0.0.1:8000
 *
 * 【メンテナンス】
 *   リポジトリ等はモジュール読込時に URL を固定せず、get*ApiBaseUrl() を都度呼ぶこと。
 */
import { getEffectiveApiTarget } from "./apiTargetsStore";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

/** 1 引数 `raw`: `import.meta.env.VITE_*` の生値。返す値は末尾スラッシュなし。 */
function resolveEnvBaseUrl(raw: unknown): string {
  if (typeof raw !== "string") {
    return DEFAULT_API_BASE_URL;
  }
  const t = raw.trim();
  if (t === "" || t === "undefined") {
    return DEFAULT_API_BASE_URL;
  }
  return t.replace(/\/+$/, "");
}

function resolveRuntimeBaseUrl(envRaw: unknown): string {
  const effective = getEffectiveApiTarget();
  if (effective) {
    return effective.baseUrl;
  }
  return resolveEnvBaseUrl(envRaw);
}

export function getMaterialApiBaseUrl(): string {
  return resolveRuntimeBaseUrl(import.meta.env.VITE_API_MATERIAL_BASE_URL);
}

export function getMonthlyApiBaseUrl(): string {
  return resolveRuntimeBaseUrl(import.meta.env.VITE_API_MONTHLY_BASE_URL);
}

export function getReportApiBaseUrl(): string {
  return resolveRuntimeBaseUrl(import.meta.env.VITE_API_REPORT_BASE_URL);
}

/** @deprecated モジュール評価時に固定されるため非推奨。getMaterialApiBaseUrl を使うこと。 */
export const MATERIAL_API_BASE_URL: string = resolveEnvBaseUrl(import.meta.env.VITE_API_MATERIAL_BASE_URL);

/** @deprecated getMonthlyApiBaseUrl を使うこと。 */
export const MONTHLY_API_BASE_URL: string = resolveEnvBaseUrl(import.meta.env.VITE_API_MONTHLY_BASE_URL);

/** @deprecated getReportApiBaseUrl を使うこと。 */
export const REPORT_API_BASE_URL: string = resolveEnvBaseUrl(import.meta.env.VITE_API_REPORT_BASE_URL);
