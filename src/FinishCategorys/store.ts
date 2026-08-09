/**
 * 仕上個別情報登録の画面状態
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import { upsertFinishCategory } from "../repositories/finishCategoryRepository";
import { applyFinishCategoryCacheUpsert } from "./applyFinishCategoryCacheUpsert";
import { finishCategoryDefaultOrganicCheck } from "./finishCategorySearchCriteria";
import { getDefaultMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import type { FinishCategoryUpsertPayload } from "./finishCategoryEditTypes";
import type {
  FinishCategoryAppliedSearchCriteria,
  FinishCategoryLotStatusRadio,
  FinishCategoryOrganicCheck
} from "./types";

export const finishCategorySearchAppliedCriteriaAtom =
  atom<FinishCategoryAppliedSearchCriteria | null>(null);

export const finishCategoryYearAtom = atom(getDefaultMakeYear());
export const finishCategoryLotStatusRadioAtom = atom<FinishCategoryLotStatusRadio>("all");

/** 未指定時は絞り込まない */
export const finishCategorySearchWorkDateAtom = atom("");

export const finishCategorySearchLotNameAtom = atom("");
export const finishCategorySearchOrganicCheckAtom = atom<FinishCategoryOrganicCheck>(
  finishCategoryDefaultOrganicCheck()
);

export const finishCategoryMutationErrorAtom = atom<string | null>(null);

export const upsertFinishCategoryAtom = atom(
  null,
  async (get, set, payload: FinishCategoryUpsertPayload) => {
    set(finishCategoryMutationErrorAtom, null);
    try {
      await upsertFinishCategory(payload);
      const cache = get(masterEntityCacheAtom);
      set(masterEntityCacheAtom, applyFinishCategoryCacheUpsert(cache, payload));
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set(finishCategoryMutationErrorAtom, `登録処理に失敗しました: ${message}`);
      return false;
    }
  }
);
