import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { refreshTrItemBomRows } from "../repositories/itemBomCorrectRepository";

/** tr_item_bom を再取得してキャッシュを更新 */
export const refreshItemBomCorrectMasterAtom = atom(null, async (_get, set) => {
  const rows = await refreshTrItemBomRows();
  let cache = _get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "tr_item_bom", rows);
  set(masterEntityCacheAtom, cache);
});
