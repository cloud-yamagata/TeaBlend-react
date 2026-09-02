import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { refreshStoreTransferRows } from "../repositories/storeTransferRepository";

/** te_store_transfer を再取得してキャッシュを更新 */
export const refreshStoreTransferMasterAtom = atom(null, async (_get, set) => {
  const rows = await refreshStoreTransferRows();
  const cache = mergeParsedTable(_get(masterEntityCacheAtom), "te_store_transfer", rows);
  set(masterEntityCacheAtom, cache);
});
