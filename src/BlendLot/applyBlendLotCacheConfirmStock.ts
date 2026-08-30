/**
 * ブレンドロット在庫確定時の te_store_transfer キャッシュ追記
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TeStoreTransfer } from "../domain/masterTableEntityModels";
import { buildBlendLotConfirmStockCacheRecords } from "./collectBlendLotConfirmStock";
import type { TeBlendLot } from "./types";

export function applyBlendLotCacheConfirmStock(
  cache: MasterEntityCache,
  lot: TeBlendLot,
  transferNos: number[]
): MasterEntityCache {
  const rawRecords = buildBlendLotConfirmStockCacheRecords(lot, transferNos);
  const newTransfers = rawRecords.map((row) => TeStoreTransfer.parse(row));

  return {
    ...cache,
    te_store_transfer: [...cache.te_store_transfer, ...newTransfers]
  };
}
