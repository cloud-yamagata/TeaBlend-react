import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { refreshTrDirectShipmentRows } from "../repositories/shipmentCorrectRepository";

/** tr_direct_shipment を再取得してキャッシュを更新 */
export const refreshShipmentCorrectMasterAtom = atom(null, async (_get, set) => {
  const rows = await refreshTrDirectShipmentRows();
  let cache = _get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "tr_direct_shipment", rows);
  set(masterEntityCacheAtom, cache);
});
