import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { refreshTrResaleRows } from "../repositories/resaleCorrectRepository";

/** tr_resale を再取得してキャッシュを更新 */
export const refreshResaleCorrectMasterAtom = atom(null, async (_get, set) => {
  const rows = await refreshTrResaleRows();
  let cache = _get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "tr_resale", rows);
  set(masterEntityCacheAtom, cache);
});
