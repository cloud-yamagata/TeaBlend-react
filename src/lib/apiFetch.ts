/**
 * 【処理概要】
 *   `fetch` のラッパーと、失敗時メッセージ整形。API が JSON 配列を返す前提のヘルプを提供。
 *
 * 【パラメータ仕様】
 *   - `formatFetchFailureMessage(url, cause)` … ネットワークエラー時に URL を付記
 *   - `fetchJsonArray(url)` … GET し、レスポンスが JSON 配列であることを検証して `unknown[]` で返す
 *
 * 【メンテナンス】
 *   - POST／オブジェクト返却 API は別途 `response.json()` を直接呼ぶか、同様の検証関数を追加する。
 */
/** fetch がネットワーク失敗したとき、ブラウザの "Failed to fetch" だけでは URL が分からないため付与する */
export function formatFetchFailureMessage(url: string, cause: unknown): string {
  const base = cause instanceof Error ? cause.message : String(cause);
  return `${base} (${url})`;
}

export async function fetchJsonArray(url: string): Promise<unknown[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} (${url})`);
  }
  // FastAPI の list エンドポイントは多くが JSON 配列。オブジェクト1件だけの API には使わないこと。
  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error(`API response is not an array (${url})`);
  }
  return raw;
}
