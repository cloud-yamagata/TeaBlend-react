import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { refreshTrSalesPlanItemRows } from "../repositories/salesPlanItemCorrectRepository";

/** tr_sales_plan_item を再取得してキャッシュを更新 */
export const refreshSalesPlanItemCorrectMasterAtom = atom(null, async (_get, set) => {
  const rows = await refreshTrSalesPlanItemRows();
  let cache = _get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "tr_sales_plan_item", rows);
  set(masterEntityCacheAtom, cache);
});
