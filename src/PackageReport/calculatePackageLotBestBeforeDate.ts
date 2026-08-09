/**
 * 製造報告書の賞味期限算出。
 * 製造日を渡し、表示用日付（yyyy/mm/dd）を返す。
 */
import { normalizeDateToYmd } from "../lib/searchNormalize";

/** 賞味期限の加算日数（仕様変更時はここを修正） */
const PACKAGE_LOT_BEST_BEFORE_OFFSET_DAYS = 365;

const toDisplayYmd = (y: number, m: number, d: number): string =>
  `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;

const parseYmdParts = (value: string): { y: number; m: number; d: number } | null => {
  const ymd = normalizeDateToYmd(value.trim() || null);
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
};

/** 製造日から賞味期限（yyyy/mm/dd）。未入力・不正時は "" */
export function calculatePackageLotBestBeforeDate(manufactureDate: string): string {
  const parts = parseYmdParts(manufactureDate);
  if (!parts) return "";
  const date = new Date(parts.y, parts.m - 1, parts.d);
  date.setDate(date.getDate() + PACKAGE_LOT_BEST_BEFORE_OFFSET_DAYS);
  return toDisplayYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** 梱包年月日（製造日の表示用 yyyy/mm/dd） */
export function formatPackageLotPackagingDate(manufactureDate: string): string {
  const parts = parseYmdParts(manufactureDate);
  if (!parts) return "";
  return toDisplayYmd(parts.y, parts.m, parts.d);
}
