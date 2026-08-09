import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { refreshStoreTransferFa2Rows } from "../repositories/storeTransferFa2Repository";

/** te_store_transfer_fa2 を再取得してキャッシュを更新 */
export const refreshStoreTransferFa2MasterAtom = atom(null, async (_get, set) => {
  const rows = await refreshStoreTransferFa2Rows();
  let cache = _get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "te_store_transfer_fa2", rows);
  set(masterEntityCacheAtom, cache);
});
