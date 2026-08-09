/** 製造ロット登録の「年」（当年下2桁～00） */

export const MAKE_YEAR_MIN = 0;

/** 当年の下2桁（例: 2026 → 26） */
export function getCurrentMakeYearMax(): number {
  return new Date().getFullYear() % 100;
}

/** 年フィールドの初期値（当年下2桁・2桁ゼロ埋め） */
export function getDefaultMakeYear(): string {
  return String(getCurrentMakeYearMax()).padStart(2, "0");
}

const parseMakeYearNumber = (text: string): number | null => {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
};

/** 表示・保存用に正規化（空白可、範囲外はクランプ） */
export function normalizeMakeYearFromForm(raw: string): string {
  const n = parseMakeYearNumber(raw);
  if (n === null) return "";
  const max = getCurrentMakeYearMax();
  let y = n;
  if (y >= 100) y = y % 100;
  y = Math.min(max, Math.max(MAKE_YEAR_MIN, y));
  return String(y).padStart(2, "0");
}

export function stepMakeYearUp(value: string): string {
  const max = getCurrentMakeYearMax();
  const n = parseMakeYearNumber(value);
  if (n === null) return String(max).padStart(2, "0");
  const y = Math.min(max, n + 1);
  return String(y).padStart(2, "0");
}

export function stepMakeYearDown(value: string): string {
  const n = parseMakeYearNumber(value);
  if (n === null) return "00";
  const y = Math.max(MAKE_YEAR_MIN, n - 1);
  return String(y).padStart(2, "0");
}

/** 2桁年度入力と make_year（2桁/4桁混在）を照合 */
export function matchesMakeYear(rowYear: number | null, filterYearText: string): boolean {
  const filter = filterYearText.trim();
  if (!filter || rowYear == null) return false;
  const filterNum = Number(filter);
  if (!Number.isFinite(filterNum)) return false;

  const rowNorm = rowYear >= 100 ? rowYear % 100 : rowYear;
  const filterNorm = filterNum >= 100 ? filterNum % 100 : filterNum;
  return rowNorm === filterNorm;
}
