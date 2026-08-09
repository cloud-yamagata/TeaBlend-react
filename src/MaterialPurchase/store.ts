/**
 * 仕上品仕入の Jotai 状態（検索ドラフト／適用パターン）
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import {
  createMaterialPurchase,
  updateMaterialPurchase,
  type MaterialPurchaseCreateBody,
  type MaterialPurchaseUpdateBody
} from "../repositories/materialPurchaseRepository";
import { applyMaterialPurchaseCacheCreate } from "./applyMaterialPurchaseCacheCreate";
import { applyMaterialPurchaseCacheUpdate } from "./applyMaterialPurchaseCacheUpdate";
import { getDefaultMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import { buildMaterialPurchaseList, filterMaterialPurchaseRows } from "./buildMaterialPurchaseList";
import type { MaterialPurchaseSearchFilters } from "./types";


export type { MaterialPurchaseSearchFilters };

export const materialPurchaseSearchDefaultFilters = (): MaterialPurchaseSearchFilters => ({
  year: getDefaultMakeYear(),
  itemNo: "",
  itemName: "",
  purchaseDate: "",
  supplier: ""
});

export const materialPurchaseSearchAppliedFiltersAtom = atom<MaterialPurchaseSearchFilters>(
  materialPurchaseSearchDefaultFilters()
);
export const materialPurchaseSearchDraftAtom = atom<MaterialPurchaseSearchFilters>(
  materialPurchaseSearchDefaultFilters()
);
export const materialPurchaseSearchExecutedAtom = atom(false);

export const materialPurchaseListAtom = atom((get) => buildMaterialPurchaseList(get(masterEntityCacheAtom)));

export const filteredMaterialPurchaseListAtom = atom((get) => {
  if (!get(materialPurchaseSearchExecutedAtom)) {
    return [];
  }
  const source = get(materialPurchaseListAtom);
  const f = get(materialPurchaseSearchAppliedFiltersAtom);
  return filterMaterialPurchaseRows(source, f);
});

export const materialPurchaseMutationErrorAtom = atom<string | null>(null);

export type MaterialPurchaseMutationResult = {
  ok: boolean;
  purchaseNo?: number;
};

/** 登録：API 成功後にキャッシュ更新（WPF StockRepository.Regist） */
export const createMaterialPurchaseAtom = atom(
  null,
  async (get, set, body: MaterialPurchaseCreateBody): Promise<MaterialPurchaseMutationResult> => {
    set(materialPurchaseMutationErrorAtom, null);
    try {
      const apiResult = await createMaterialPurchase(body);
      const cache = get(masterEntityCacheAtom);
      set(masterEntityCacheAtom, applyMaterialPurchaseCacheCreate(cache, body, apiResult));

      const prev = get(materialPurchaseSearchDraftAtom);
      const filters: MaterialPurchaseSearchFilters = {
        ...prev,
        itemNo: String(body.item_no),
        itemName: body.item_name
      };
      set(materialPurchaseSearchDraftAtom, filters);
      set(materialPurchaseSearchAppliedFiltersAtom, filters);
      set(materialPurchaseSearchExecutedAtom, true);

      return { ok: true, purchaseNo: apiResult.purchase_no };
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      set(materialPurchaseMutationErrorAtom, `登録処理に失敗しました: ${detail}`);
      return { ok: false };
    }
  }
);

/** 更新：te_material_purchase のみ（WPF Update から store/lot 更新を除外） */
export const updateMaterialPurchaseAtom = atom(
  null,
  async (get, set, body: MaterialPurchaseUpdateBody): Promise<MaterialPurchaseMutationResult> => {
    set(materialPurchaseMutationErrorAtom, null);
    try {
      const apiResult = await updateMaterialPurchase(body);
      const cache = get(masterEntityCacheAtom);
      set(masterEntityCacheAtom, applyMaterialPurchaseCacheUpdate(cache, body));

      const prev = get(materialPurchaseSearchDraftAtom);
      const filters: MaterialPurchaseSearchFilters = {
        ...prev,
        itemNo: String(body.item_no),
        itemName: body.item_name
      };
      set(materialPurchaseSearchDraftAtom, filters);
      set(materialPurchaseSearchAppliedFiltersAtom, filters);
      set(materialPurchaseSearchExecutedAtom, true);

      return { ok: true, purchaseNo: apiResult.purchase_no };
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      set(materialPurchaseMutationErrorAtom, `更新処理に失敗しました: ${detail}`);
      return { ok: false };
    }
  }
);
