/**
 * レポート判定列（pass/fail または 晴れ/雨）を天気キーへ正規化する。
 */
export type ReportWeatherKey = "sun" | "rain" | "";

export function reportWeatherKey(value: unknown): ReportWeatherKey {
  const s = value == null ? "" : String(value).trim().toLowerCase();
  if (s === "pass" || s === "晴れ") return "sun";
  if (s === "fail" || s === "雨") return "rain";
  return "";
}
