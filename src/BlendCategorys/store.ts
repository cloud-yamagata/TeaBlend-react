/**
 * 配合個別情報登録の画面状態
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import { upsertBlendCategory } from "../repositories/blendCategoryRepository";
import { applyBlendCategoryCacheUpsert } from "./applyBlendCategoryCacheUpsert";
import { blendCategoryDefaultOrganicCheck } from "./blendCategorySearchCriteria";
import { getDefaultMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import type { BlendCategoryUpsertPayload } from "./blendCategoryEditTypes";
import type {
  BlendCategoryAppliedSearchCriteria,
  BlendCategoryLotStatusRadio,
  BlendCategoryOrganicCheck
} from "./types";

export const blendCategorySearchAppliedCriteriaAtom = atom<BlendCategoryAppliedSearchCriteria | null>(
  null
);

export const blendCategoryYearAtom = atom(getDefaultMakeYear());
export const blendCategoryLotStatusRadioAtom = atom<BlendCategoryLotStatusRadio>("all");

/** 未指定時は絞り込まない（仕入受入の仕入日と同様） */
export const blendCategorySearchWorkDateAtom = atom("");

export const blendCategorySearchLotNameAtom = atom("");
export const blendCategorySearchOrganicCheckAtom = atom<BlendCategoryOrganicCheck>(
  blendCategoryDefaultOrganicCheck()
);

export const blendCategoryMutationErrorAtom = atom<string | null>(null);

export const upsertBlendCategoryAtom = atom(
  null,
  async (get, set, payload: BlendCategoryUpsertPayload) => {
    set(blendCategoryMutationErrorAtom, null);
    try {
      await upsertBlendCategory(payload);
      const cache = get(masterEntityCacheAtom);
      set(masterEntityCacheAtom, applyBlendCategoryCacheUpsert(cache, payload));
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set(blendCategoryMutationErrorAtom, `登録処理に失敗しました: ${message}`);
      return false;
    }
  }
);
