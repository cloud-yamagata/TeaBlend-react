/**
 * 起動時スプラッシュの表示文言（デモ等で .env から差し替え）
 *
 * 例（.env.development）:
 *   VITE_LOADING_SPLASH_MESSAGE=TeaBlend システムを起動しています…
 *   VITE_LOADING_SPLASH_SUB_MESSAGE=マスタデータを読み込んでいます
 */
const trimEnv = (raw: unknown): string =>
  typeof raw === "string" ? raw.trim() : "";

/** 起動画面のメイン文言（デモ用・差し替え推奨） */
export const LOADING_SPLASH_MESSAGE =
  trimEnv(import.meta.env.VITE_LOADING_SPLASH_MESSAGE) || "システムを起動しています…";

/** 起動画面のサブ文言（未設定時は runBusy のメッセージを表示） */
export const LOADING_SPLASH_SUB_MESSAGE = trimEnv(import.meta.env.VITE_LOADING_SPLASH_SUB_MESSAGE);
