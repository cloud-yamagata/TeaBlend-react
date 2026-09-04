/**
 * 仕上品受入の Jotai 状態（受入登録ミューテーション）
 */
import { atom } from "jotai";
import {
  receivePartsReceive,
  type PartsReceiveReceiveBody
} from "../repositories/partsReceiveRepository";

export const partsReceiveMutationErrorAtom = atom<string | null>(null);

/** 受入登録 */
export const receivePartsReceiveAtom = atom(
  null,
  async (_get, set, body: PartsReceiveReceiveBody): Promise<{ ok: boolean }> => {
    set(partsReceiveMutationErrorAtom, null);
    try {
      await receivePartsReceive(body);
      return { ok: true };
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      set(partsReceiveMutationErrorAtom, `受入処理に失敗しました: ${detail}`);
      return { ok: false };
    }
  }
);
