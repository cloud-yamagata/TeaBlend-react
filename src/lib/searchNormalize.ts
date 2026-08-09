/**
 * 【処理概要】
 *   画面・API の検索条件と行データを比較するときの文字列正規化（日付・部分一致）。
 *
 * 【パラメータ仕様】
 *   - `normalizeDateToYmd(value)` … `yyyy-mm-dd` 相当へ。パース不能は `null`
 *   - `matchesContains(haystack, needle)` … `needle` が空なら常に true。大小無視の部分一致
 *
 * 【メンテナンス】
 *   - 仕入日は `input type="date"` の値（`yyyy-mm-dd`）と揃える用途が主。タイムゾーン注意は DB 側定義に従う。
 */
/** API / DB の日付文字列を yyyy-mm-dd に正規化（比較用） */
export function normalizeDateToYmd(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) {
    return null;
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** 仕様: 項目値が「*検索値*」相当（部分一致・大小無視） */
export function matchesContains(haystack: string, needle: string): boolean {
  const q = needle.trim();
  if (!q) {
    return true;
  }
  return haystack.toLowerCase().includes(q.toLowerCase());
}
