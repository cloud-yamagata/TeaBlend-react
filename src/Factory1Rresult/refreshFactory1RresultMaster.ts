import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { fetchFactory1ResultRows, fetchFactory1TransferRows } from "../repositories/factory1ResultRepository";

/** te_factory1_result / te_factory1_transfer を再取得してマスタキャッシュを更新 */
export const refreshFactory1RresultMasterAtom = atom(null, async (get, set) => {
  const [resultRows, transferRows] = await Promise.all([
    fetchFactory1ResultRows(),
    fetchFactory1TransferRows()
  ]);
  let cache = get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "te_factory1_result", resultRows);
  cache = mergeParsedTable(cache, "te_factory1_transfer", transferRows);
  set(masterEntityCacheAtom, cache);
});
