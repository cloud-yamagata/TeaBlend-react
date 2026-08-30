/**
 * ブレンドロットの CRUD 用 write atom（loading / error 同期）。
 */
import { atom } from "jotai";
import { masterBlendLotsAtom, masterEntityCacheAtom } from "../repository/masterData";
import {
  confirmBlendLotStock as confirmBlendLotStockRepo,
  createBlendLot as createBlendLotRepo,
  deleteBlendLots as deleteBlendLotsRepo,
  updateBlendLot as updateBlendLotRepo
} from "../repositories/blendLotRepository";
import { applyBlendLotCacheConfirmStock } from "./applyBlendLotCacheConfirmStock";
import { collectBlendLotConfirmStockApiBody } from "./collectBlendLotConfirmStock";
import { PACKAGE_LOT_STATUS_CONFIRMED } from "../PackageReport/packageLotDisplay";
import type { TeBlendLot } from "./types";

export const blendLotListAtom = masterBlendLotsAtom;

const toBlendLotKey = (lot: TeBlendLot): string => {
  return String(lot.productNo ?? "product");
};

const upsertBlendLot = (source: TeBlendLot[], nextLot: TeBlendLot): TeBlendLot[] => {
  const nextKey = toBlendLotKey(nextLot);
  const exists = source.some((row) => toBlendLotKey(row) === nextKey);
  if (exists) {
    return source.map((row) => (toBlendLotKey(row) === nextKey ? nextLot : row));
  }
  return [nextLot, ...source];
};

export const loadingAtom = atom(false);
const errorMessageValueAtom = atom<string | null>(null);
export const errorMessageAtom = atom(
  (get) => get(errorMessageValueAtom),
  (_get, set, nextMessage: string | null) => {
    set(errorMessageValueAtom as never, nextMessage as never);
  }
);

export const deleteBlendLotsAtom = atom(null, async (_get, set, targets: TeBlendLot[]) => {
  if (targets.length === 0) {
    return false;
  }

  const targetKeys = new Set(targets.map((row) => toBlendLotKey(row)));

  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    await deleteBlendLotsRepo(targets);
    set(blendLotListAtom, (prev) => prev.filter((row) => !targetKeys.has(toBlendLotKey(row))));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `削除処理に失敗しました: ${message}`);
    return false;
  } finally {
    set(loadingAtom, false);
  }
});

export const createBlendLotAtom = atom(null, async (_get, set, payload: Record<string, unknown>) => {
  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    const created = await createBlendLotRepo(payload);
    set(blendLotListAtom, (prev) => upsertBlendLot(prev, created));
    return created;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `登録処理に失敗しました: ${message}`);
    return null;
  } finally {
    set(loadingAtom, false);
  }
});

export const updateBlendLotAtom = atom(null, async (_get, set, payload: Record<string, unknown>) => {
  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    const updated = await updateBlendLotRepo(payload);
    set(blendLotListAtom, (prev) => upsertBlendLot(prev, updated));
    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `更新処理に失敗しました: ${message}`);
    return null;
  } finally {
    set(loadingAtom, false);
  }
});

export const confirmBlendLotStockAtom = atom(null, async (get, set, lot: TeBlendLot) => {
  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    const apiBody = collectBlendLotConfirmStockApiBody(lot);
    const apiResult = await confirmBlendLotStockRepo(apiBody);
    const cache = get(masterEntityCacheAtom);
    set(masterEntityCacheAtom, applyBlendLotCacheConfirmStock(cache, lot, apiResult.transfer_nos));

    const confirmedLot: TeBlendLot = {
      ...lot,
      lotStatus: PACKAGE_LOT_STATUS_CONFIRMED
    };
    set(blendLotListAtom, (prev) => upsertBlendLot(prev, confirmedLot));
    return confirmedLot;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `在庫確定処理に失敗しました: ${message}`);
    return null;
  } finally {
    set(loadingAtom, false);
  }
});
