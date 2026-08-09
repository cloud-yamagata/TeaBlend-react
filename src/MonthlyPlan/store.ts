/**
 * 【処理概要】
 *   月次計画の検索条件・一覧派生、CRUD 用 write atom（loading / error 同期）。
 *
 * 【パラメータ仕様】
 *   - `MonthlyPlanSearchFilters` … 年月・工程・ロット名・作業日・商品番号・商品名（tr_item 経由の部分一致）
 *   - `createMonthlyPlanAtom` / `updateMonthlyPlanAtom` … `Record<string, unknown>` を API へ POST
 *
 * 【メンテナンス】
 *   API 契約変更時は `repositories/monthlyPlanRepository.ts` と手を動かす。
 */
import { atom } from "jotai";
import { getDefaultYearInputValue } from "../components/yearNumberInputUtils";
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import { masterMonthlyPlansAtom, masterTrItemsAtom } from "../repository/masterData";
import {
  createMonthlyPlan as createMonthlyPlanRepo,
  deleteMonthlyPlans as deleteMonthlyPlansRepo,
  updateMonthlyPlan as updateMonthlyPlanRepo
} from "../repositories/monthlyPlanRepository";
import type { TeMonthlyPlan, TrItem } from "./types";

/** マスタ本体は repository/masterData の原子と同一参照 */
export const monthlyPlanListAtom = masterMonthlyPlansAtom;
export const itemListAtom = masterTrItemsAtom;

const upsertMonthlyPlan = (source: TeMonthlyPlan[], nextPlan: TeMonthlyPlan): TeMonthlyPlan[] => {
  const nextKey = toMonthlyPlanKey(nextPlan);
  const exists = source.some((row) => toMonthlyPlanKey(row) === nextKey);
  if (exists) {
    return source.map((row) => (toMonthlyPlanKey(row) === nextKey ? nextPlan : row));
  }
  return [nextPlan, ...source];
};

const toMonthlyPlanKey = (plan: TeMonthlyPlan): string => {
  return `${plan.planNo ?? "plan"}-${plan.year ?? ""}-${plan.month ?? ""}-${plan.itemNo ?? ""}`;
};

/** 検索に適用済みの条件 */
export type MonthlyPlanSearchFilters = {
  year: string;
  month: string;
  processType: string;
  lotName: string;
  workDate: string;
  itemNo: string;
  /** 商品名（tr_item.item_name 由来。計画行の item_no から解決して部分一致） */
  itemName: string;
};

export const monthlyPlanSearchDefaultFilters = (): MonthlyPlanSearchFilters => ({
  year: getDefaultYearInputValue(),
  month: "",
  processType: "",
  lotName: "",
  workDate: "",
  itemNo: "",
  itemName: ""
});

export const monthlyPlanSearchAppliedFiltersAtom = atom<MonthlyPlanSearchFilters>(monthlyPlanSearchDefaultFilters());
/** true のときのみ一覧に行を出す */
export const monthlyPlanSearchExecutedAtom = atom(false);
export const loadingAtom = atom(false);
const errorMessageValueAtom = atom<string | null>(null);
export const errorMessageAtom = atom(
  (get) => get(errorMessageValueAtom),
  (_get, set, nextMessage: string | null) => {
    set(errorMessageValueAtom as never, nextMessage as never);
  }
);

const isMonthlyFiltersAllEmpty = (f: MonthlyPlanSearchFilters): boolean => {
  return (
    f.year.trim() === "" &&
    f.month.trim() === "" &&
    f.processType.trim() === "" &&
    f.lotName.trim() === "" &&
    f.workDate.trim() === "" &&
    f.itemNo.trim() === "" &&
    f.itemName.trim() === ""
  );
};

const matchesMonthlyFilters = (row: TeMonthlyPlan, f: MonthlyPlanSearchFilters, items: TrItem[]): boolean => {
  if (f.year.trim() !== "") {
    const want = Number(f.year.trim());
    if (!Number.isFinite(want) || row.year == null || row.year !== want) {
      return false;
    }
  }

  if (f.month.trim() !== "") {
    const want = Number(f.month.trim());
    if (!Number.isFinite(want) || row.month == null || row.month !== want) {
      return false;
    }
  }

  if (f.processType.trim() !== "") {
    if ((row.processType ?? "").trim() !== f.processType.trim()) {
      return false;
    }
  }

  if (!matchesContains(String(row.lotName ?? ""), f.lotName)) {
    return false;
  }

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
    const linked = items.find((i) => i.itemNo != null && row.itemNo != null && i.itemNo === row.itemNo);
    if (!matchesContains(String(linked?.itemName ?? ""), f.itemName)) {
      return false;
    }
  }

  return true;
};

export const filteredMonthlyPlanListAtom = atom((get) => {
  if (!get(monthlyPlanSearchExecutedAtom)) {
    return [];
  }

  const source = get(monthlyPlanListAtom);
  const f = get(monthlyPlanSearchAppliedFiltersAtom);
  const items = get(itemListAtom);

  if (isMonthlyFiltersAllEmpty(f)) {
    return source;
  }

  return source.filter((row) => matchesMonthlyFilters(row, f, items));
});

export const deleteMonthlyPlansAtom = atom(null, async (_get, set, targets: TeMonthlyPlan[]) => {
  if (targets.length === 0) {
    return false;
  }

  const targetKeys = new Set(targets.map((row) => toMonthlyPlanKey(row)));

  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    await deleteMonthlyPlansRepo(targets);
    set(monthlyPlanListAtom, (prev) => prev.filter((row) => !targetKeys.has(toMonthlyPlanKey(row))));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `削除処理に失敗しました: ${message}`);
    return false;
  } finally {
    set(loadingAtom, false);
  }
});

export const createMonthlyPlanAtom = atom(null, async (_get, set, payload: Record<string, unknown>) => {
  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    const createdPlan = await createMonthlyPlanRepo(payload);
    set(monthlyPlanListAtom, (prev) => upsertMonthlyPlan(prev, createdPlan));
    return createdPlan;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `登録処理に失敗しました: ${message}`);
    return null;
  } finally {
    set(loadingAtom, false);
  }
});

export const updateMonthlyPlanAtom = atom(null, async (_get, set, payload: Record<string, unknown>) => {
  set(loadingAtom, true);
  set(errorMessageAtom, null);

  try {
    const updatedPlan = await updateMonthlyPlanRepo(payload);
    set(monthlyPlanListAtom, (prev) => upsertMonthlyPlan(prev, updatedPlan));
    return updatedPlan;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(errorMessageAtom, `更新処理に失敗しました: ${message}`);
    return null;
  } finally {
    set(loadingAtom, false);
  }
});
