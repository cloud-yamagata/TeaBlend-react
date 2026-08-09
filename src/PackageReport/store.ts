/**
 * パッケージ製造報告書 … API 成功後にキャッシュ更新
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import {
  confirmPackageLotStockManufacture,
  createPackageLotManufacture,
  deletePackageLotManufacture,
  updatePackageLotManufacture
} from "../repositories/packageLotManufactureRepository";
import { applyPackageLotCacheConfirmStock } from "./applyPackageLotCacheConfirmStock";
import { applyPackageLotCacheCreate } from "./applyPackageLotCacheCreate";
import { applyPackageLotCacheDelete } from "./applyPackageLotCacheDelete";
import { applyPackageLotCacheUpdate } from "./applyPackageLotCacheUpdate";
import {
  collectPackageLotConfirmStockApiBody,
  collectPackageLotCreateApiBody,
  collectPackageLotCreatePayload,
  collectPackageLotDeleteProductNo,
  collectPackageLotUpdateApiBody,
  collectPackageLotUpdatePayload
} from "./collectPackageLotEditPayload";
import type { PackageLotEditFormData } from "./packageLotEditTypes";

export const packageLotMutationErrorAtom = atom<string | null>(null);

export type PackageLotSaveResult = {
  ok: boolean;
  productNo?: number;
  lotStatus?: string;
};

const mutationErrorMessage = (e: unknown, action: string): string => {
  const detail = e instanceof Error ? e.message : String(e);
  return `${action}に失敗しました: ${detail}`;
};

/** 登録：API 成功後にキャッシュ更新 */
export const createPackageLotAtom = atom(
  null,
  async (get, set, form: PackageLotEditFormData): Promise<PackageLotSaveResult> => {
    set(packageLotMutationErrorAtom, null);
    try {
      const apiBody = collectPackageLotCreateApiBody(form);
      const apiResult = await createPackageLotManufacture(apiBody);
      const cache = get(masterEntityCacheAtom);
      const payload = collectPackageLotCreatePayload(cache, form, apiResult.product_no);
      set(masterEntityCacheAtom, applyPackageLotCacheCreate(cache, payload));
      return { ok: true, productNo: payload.product_no, lotStatus: payload.lot_status };
    } catch (e) {
      set(packageLotMutationErrorAtom, mutationErrorMessage(e, "登録処理"));
      return { ok: false };
    }
  }
);

/** 変更：API 成功後にキャッシュ更新 */
export const updatePackageLotAtom = atom(
  null,
  async (get, set, form: PackageLotEditFormData): Promise<PackageLotSaveResult> => {
    set(packageLotMutationErrorAtom, null);
    try {
      const cache = get(masterEntityCacheAtom);
      const apiBody = collectPackageLotUpdateApiBody(cache, form);
      await updatePackageLotManufacture(apiBody);
      const payload = collectPackageLotUpdatePayload(cache, form);
      set(masterEntityCacheAtom, applyPackageLotCacheUpdate(cache, payload));
      return { ok: true, productNo: payload.product_no, lotStatus: payload.lot_status };
    } catch (e) {
      set(packageLotMutationErrorAtom, mutationErrorMessage(e, "変更処理"));
      return { ok: false };
    }
  }
);

/** 削除：API 成功後にキャッシュ更新 */
export const deletePackageLotAtom = atom(
  null,
  async (get, set, form: PackageLotEditFormData): Promise<boolean> => {
    set(packageLotMutationErrorAtom, null);
    try {
      const productNo = collectPackageLotDeleteProductNo(form);
      await deletePackageLotManufacture(productNo);
      const cache = get(masterEntityCacheAtom);
      set(masterEntityCacheAtom, applyPackageLotCacheDelete(cache, productNo));
      return true;
    } catch (e) {
      set(packageLotMutationErrorAtom, mutationErrorMessage(e, "削除処理"));
      return false;
    }
  }
);

/** 在庫確定：API 成功後にキャッシュ更新 */
export const confirmPackageLotStockAtom = atom(
  null,
  async (get, set, form: PackageLotEditFormData): Promise<PackageLotSaveResult> => {
    set(packageLotMutationErrorAtom, null);
    try {
      const apiBody = collectPackageLotConfirmStockApiBody(form);
      const apiResult = await confirmPackageLotStockManufacture(apiBody);
      const cache = get(masterEntityCacheAtom);
      set(
        masterEntityCacheAtom,
        applyPackageLotCacheConfirmStock(
          cache,
          apiResult.product_no,
          apiBody,
          apiResult.transfer_nos
        )
      );
      return {
        ok: true,
        productNo: apiResult.product_no,
        lotStatus: apiResult.lot_status
      };
    } catch (e) {
      set(packageLotMutationErrorAtom, mutationErrorMessage(e, "在庫確定処理"));
      return { ok: false };
    }
  }
);
