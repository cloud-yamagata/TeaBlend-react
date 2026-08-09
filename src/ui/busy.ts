/**
 * 【処理概要】
 *   Jotai の参照カウント風 busy 制御。`busyStartAtom` で +1、`busyEndAtom` で -1。
 *
 * 【パラメータ仕様】
 *   - `busyStartAtom` の第2引数 `message` … 空でなければ `busyMessageAtom` を上書き
 *
 * 【メンテナンス】
 *   `busyStart` したら必ず `busyEnd` すること。`useBusyTask` が try/finally で保証する。
 */
import { atom } from "jotai";

export const busyCountAtom = atom(0);
export const busyMessageAtom = atom<string>("処理中...");
/** 起動時スプラッシュ（茶畑背景画像）を表示するか */
export const busySplashAtom = atom(false);

export const isBusyAtom = atom((get) => get(busyCountAtom) > 0);

export const busyStartAtom = atom(null, (_get, set, message?: string) => {
  if (message && message.trim() !== "") {
    set(busyMessageAtom, message);
  }
  set(busyCountAtom, (c) => c + 1);
});

export const busyEndAtom = atom(null, (get, set) => {
  const next = Math.max(0, get(busyCountAtom) - 1);
  set(busyCountAtom, next);
  if (next === 0) {
    set(busySplashAtom, false);
  }
});

