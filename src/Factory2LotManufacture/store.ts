/**
 * 第二工場ロット製造登録の画面状態（SPA でルート遷移後も検索結果を保持）
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import {
  createFactory2LotManufacture,
  deleteFactory2LotManufacture,
  updateFactory2LotManufacture
} from "../repositories/factory2LotManufactureRepository";
import { applyFactory2LotCacheCreate } from "./applyFactory2LotCacheCreate";
import { applyFactory2LotCacheDelete } from "./applyFactory2LotCacheDelete";
import { applyFactory2LotCacheUpdate } from "./applyFactory2LotCacheUpdate";
import type {
  Factory2LotCreatePayload,
  Factory2LotUpdatePayload
} from "./collectFactory2LotEditPayload";
import { getDefaultMakeYear } from "./factory2MakeYear";
import type {
  Factory2AppliedSearchCriteria,
  Factory2LotStatusCheck,
  Factory2OrganicCheck,
  Factory2ProcessCheck,
  Factory2LotRegistProcessFilter
} from "./types";

export const factory2LotDefaultLotStatusCheck = (): Factory2LotStatusCheck => ({
  active: false,
  complete: false,
  confirm: false
});

export const factory2LotDefaultProcessCheck = (): Factory2ProcessCheck => ({
  "02": false,
  "03": false,
  "04": false,
  "05": false
});

export const factory2LotDefaultOrganicCheck = (): Factory2OrganicCheck => ({
  organic: false,
  pesticideFree: false,
  general: false
});

/** 検索ボタン押下時に確定した条件（null = 未検索） */
export const factory2LotSearchAppliedCriteriaAtom = atom<Factory2AppliedSearchCriteria | null>(null);

/** 1段目：工程ラジオ（登録用・初期は未選択） */
export const factory2LotProcessFilterAtom = atom<Factory2LotRegistProcessFilter>("");

export const factory2LotRegistItemNoAtom = atom("");
export const factory2LotRegistItemNameAtom = atom("");
/** 1段目：月次計画の計画No（登録時の参照用） */
export const factory2LotRegistPlanNoAtom = atom("");

/** 2段目：検索条件（入力中。検索実行時に appliedCriteria にコピー） */
export const factory2LotSearchYearAtom = atom(getDefaultMakeYear());
export const factory2LotSearchLotStatusAtom = atom<Factory2LotStatusCheck>(factory2LotDefaultLotStatusCheck());
export const factory2LotSearchProcessCheckAtom = atom<Factory2ProcessCheck>(factory2LotDefaultProcessCheck());
export const factory2LotSearchOrganicCheckAtom = atom<Factory2OrganicCheck>(factory2LotDefaultOrganicCheck());
export const factory2LotSearchProductDateAtom = atom("");
export const factory2LotSearchItemNameAtom = atom("");

export const factory2LotMutationErrorAtom = atom<string | null>(null);

/** 登録：API 成功後にキャッシュ更新 */
export const createFactory2LotAtom = atom(null, async (get, set, payload: Factory2LotCreatePayload) => {
  set(factory2LotMutationErrorAtom, null);
  try {
    const apiResult = await createFactory2LotManufacture(payload);
    const cache = get(masterEntityCacheAtom);
    set(
      masterEntityCacheAtom,
      applyFactory2LotCacheCreate(
        cache,
        { lot_no: apiResult.lot_no, product_no: apiResult.product_no! },
        payload
      )
    );
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    set(factory2LotMutationErrorAtom, `登録処理に失敗しました: ${message}`);
    return false;
  }
});

/** 変更：API 成功後にキャッシュ更新 */
export const updateFactory2LotAtom = atom(null, async (get, set, payload: Factory2LotUpdatePayload) => {
  set(factory2LotMutationErrorAtom, null);
  try {
    await updateFactory2LotManufacture(payload);
    const cache = get(masterEntityCacheAtom);
    set(masterEntityCacheAtom, applyFactory2LotCacheUpdate(cache, payload));
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    set(factory2LotMutationErrorAtom, `変更処理に失敗しました: ${message}`);
    return false;
  }
});

/** 削除：API 成功後にキャッシュ更新 */
export const deleteFactory2LotAtom = atom(null, async (get, set, lotNo: number) => {
  set(factory2LotMutationErrorAtom, null);
  try {
    await deleteFactory2LotManufacture(lotNo);
    const cache = get(masterEntityCacheAtom);
    set(masterEntityCacheAtom, applyFactory2LotCacheDelete(cache, lotNo));
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    set(factory2LotMutationErrorAtom, `削除処理に失敗しました: ${message}`);
    return false;
  }
});
