import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { fetchPurchaseTeaRows } from "../repositories/purchaseTeaRepository";

/** te_purchase_tea のみ再取得してマスタキャッシュを更新 */
export const refreshPurchaseTeaMasterAtom = atom(null, async (get, set) => {
  const rows = await fetchPurchaseTeaRows();
  const cache = get(masterEntityCacheAtom);
  set(masterEntityCacheAtom, mergeParsedTable(cache, "te_purchase_tea", rows));
});
