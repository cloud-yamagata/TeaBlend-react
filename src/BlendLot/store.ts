/**
 * ブレンドロットの検索条件・一覧派生、CRUD 用 write atom（loading / error 同期）。
 */
import { atom } from "jotai";
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import { masterBlendLotsAtom } from "../repository/masterData";
import {
  createBlendLot as createBlendLotRepo,
  deleteBlendLots as deleteBlendLotsRepo,
  updateBlendLot as updateBlendLotRepo
} from "../repositories/blendLotRepository";
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

export type BlendLotSearchFilters = {
  workDate: string;
  itemNo: string;
  itemName: string;
};

export const blendLotSearchDefaultFilters = (): BlendLotSearchFilters => ({
  workDate: "",
  itemNo: "",
  itemName: ""
});

export const blendLotSearchAppliedFiltersAtom = atom<BlendLotSearchFilters>(blendLotSearchDefaultFilters());
export const blendLotSearchExecutedAtom = atom(false);
export const loadingAtom = atom(false);
const errorMessageValueAtom = atom<string | null>(null);
export const errorMessageAtom = atom(
  (get) => get(errorMessageValueAtom),
  (_get, set, nextMessage: string | null) => {
    set(errorMessageValueAtom as never, nextMessage as never);
  }
);

const isBlendLotFiltersAllEmpty = (f: BlendLotSearchFilters): boolean => {
  return f.workDate.trim() === "" && f.itemNo.trim() === "" && f.itemName.trim() === "";
};

const matchesBlendLotFilters = (row: TeBlendLot, f: BlendLotSearchFilters): boolean => {
  if (f.workDate.trim() !== "") {
    const rowYmd = normalizeDateToYmd(row.workDate);
    if (rowYmd !== f.workDate.trim()) {
      return false;
    }
  }

  if (f.itemNo.trim() !== "") {
    if (!matchesContains(String(row.itemNo ?? ""), f.itemNo)) {
      return false;
    }
  }

  if (f.itemName.trim() !== "") {
    if (!matchesContains(String(row.itemName ?? ""), f.itemName)) {
      return false;
    }
  }

  return true;
};

export const filteredBlendLotListAtom = atom((get) => {
  if (!get(blendLotSearchExecutedAtom)) {
    return [];
  }

  const source = get(blendLotListAtom);
  const f = get(blendLotSearchAppliedFiltersAtom);

  if (isBlendLotFiltersAllEmpty(f)) {
    return source;
  }

  return source.filter((row) => matchesBlendLotFilters(row, f));
});

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
