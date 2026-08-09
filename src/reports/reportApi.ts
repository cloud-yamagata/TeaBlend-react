/**
 * 【処理概要】
 *   レポート API（実行・Excel ダウンロード）を `getReportApiBaseUrl()` 経由で呼び出す。
 *
 * 【パラメータ仕様】
 *   - `runReport(reportId, params)` … POST JSON `{ params }`、戻りは `{ reportId, title, rows }`
 *   - `downloadReportExcel` … Blob を生成し、指定 `filename` でブラウザ保存
 */
import { getReportApiBaseUrl } from "../config/api";
import { formatFetchFailureMessage } from "../lib/apiFetch";

export type ReportRunResponse = {
  reportId: string;
  title: string;
  rows: Record<string, unknown>[];
};

export async function runReport(reportId: string, params: Record<string, unknown>): Promise<ReportRunResponse> {
  const url = `${getReportApiBaseUrl()}/reports/${encodeURIComponent(reportId)}/run`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params })
    });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`レポート実行に失敗しました: ${res.status} ${text}`.trim());
  }
  return (await res.json()) as ReportRunResponse;
}

export async function downloadReportExcel(reportId: string, params: Record<string, unknown>, filename: string): Promise<void> {
  const url = `${getReportApiBaseUrl()}/reports/${encodeURIComponent(reportId)}/excel`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params })
    });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Excel出力に失敗しました: ${res.status} ${text}`.trim());
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

