/**
 * 【処理概要】
 *   `busyStartAtom` / `busyEndAtom` をまとめて扱うフック。非同期タスクの前後でオーバーレイを自動表示。
 *
 * 【パラメータ仕様】
 *   - 戻り値 `runBusy(task, message?)` … `task` は Promise を返す関数
 *
 * 【メンテナンス】
 *   依存配列にこの関数を入れない（参照が毎レンダリングで変わる実装のため）。
 */
import { useSetAtom } from "jotai";
import { busyEndAtom, busyStartAtom } from "./busy";

export function useBusyTask() {
  const start = useSetAtom(busyStartAtom);
  const end = useSetAtom(busyEndAtom);

  return async function runBusy<T>(task: () => Promise<T>, message?: string): Promise<T> {
    start(message);
    try {
      return await task();
    } finally {
      end();
    }
  };
}

