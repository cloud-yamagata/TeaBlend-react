import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { fetchPurchaseTransferRows } from "../repositories/purchaseTransferRepository";

/** te_purchase_transfer のみ再取得してマスタキャッシュを更新 */
export const refreshPurchaseTransferMasterAtom = atom(null, async (get, set) => {
  const rows = await fetchPurchaseTransferRows();
  const cache = get(masterEntityCacheAtom);
  set(masterEntityCacheAtom, mergeParsedTable(cache, "te_purchase_transfer", rows));
});
