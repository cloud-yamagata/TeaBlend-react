/**
 * ロット分割後に関連マスタを再取得
 */
import { atom } from "jotai";
import { mergeParsedTable, type GenericMasterTableId } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";
import { fetchMasterTableList, GENERIC_MASTER_TABLE_SPECS } from "../repositories/masterTableRepository";

const REFRESH_IDS: GenericMasterTableId[] = [
  "vi_factory2_stock",
  "te_lot_divide",
  "te_store_transfer_fa2",
  "te_lot_use_item"
];

export const refreshLotDivideMastersAtom = atom(null, async (get, set) => {
  let cache = get(masterEntityCacheAtom);
  for (const id of REFRESH_IDS) {
    const spec = GENERIC_MASTER_TABLE_SPECS.find((s) => s.id === id);
    if (!spec) continue;
    const rows = await fetchMasterTableList(spec.buildUrl());
    cache = mergeParsedTable(cache, id, rows);
  }
  set(masterEntityCacheAtom, cache);
});
