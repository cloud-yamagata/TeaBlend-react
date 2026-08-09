import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import { upsertFirepanCategory } from "../repositories/firepanCategoryRepository";
import { applyFirepanCategoryCacheUpsert } from "./applyFirepanCategoryCacheUpsert";
import { firepanCategoryDefaultOrganicCheck } from "./firepanCategorySearchCriteria";
import { getDefaultMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import type { FirepanCategoryUpsertPayload } from "./firepanCategoryEditTypes";
import type {
  FirepanCategoryAppliedSearchCriteria,
  FirepanCategoryLotStatusRadio,
  FirepanCategoryOrganicCheck
} from "./types";

export const firepanCategorySearchAppliedCriteriaAtom =
  atom<FirepanCategoryAppliedSearchCriteria | null>(null);

export const firepanCategoryYearAtom = atom(getDefaultMakeYear());
export const firepanCategoryLotStatusRadioAtom = atom<FirepanCategoryLotStatusRadio>("all");
export const firepanCategorySearchWorkDateAtom = atom("");
export const firepanCategorySearchLotNameAtom = atom("");
export const firepanCategorySearchOrganicCheckAtom = atom<FirepanCategoryOrganicCheck>(
  firepanCategoryDefaultOrganicCheck()
);
export const firepanCategoryMutationErrorAtom = atom<string | null>(null);

export const upsertFirepanCategoryAtom = atom(
  null,
  async (get, set, payload: FirepanCategoryUpsertPayload) => {
    set(firepanCategoryMutationErrorAtom, null);
    try {
      await upsertFirepanCategory(payload);
      const cache = get(masterEntityCacheAtom);
      set(masterEntityCacheAtom, applyFirepanCategoryCacheUpsert(cache, payload));
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set(firepanCategoryMutationErrorAtom, `登録処理に失敗しました: ${message}`);
      return false;
    }
  }
);
