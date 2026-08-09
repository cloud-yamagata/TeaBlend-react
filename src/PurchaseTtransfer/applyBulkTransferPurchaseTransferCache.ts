/**
 * 一括振分 … te_purchase_transfer キャッシュ更新（フロント側）
 */
import { atom } from "jotai";
import {
  TePurchaseTransfer,
  type MasterEntityCache,
  type TePurchaseTransferData
} from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom } from "../repository/masterData";

const purchaseTransferKey = (d: TePurchaseTransferData): string =>
  `${d.year}|${d.purchase}|${d.bid_no}|${d.result_type}|${d.transfer}`;

export function applyBulkTransferToPurchaseTransferCache(
  cache: MasterEntityCache,
  bodies: readonly Record<string, unknown>[]
): { nextCache: MasterEntityCache; updatedCount: number } {
  if (bodies.length === 0) {
    return { nextCache: cache, updatedCount: 0 };
  }

  const now = new Date().toISOString();
  const index = new Map<string, TePurchaseTransfer>();
  for (const entity of cache.te_purchase_transfer) {
    index.set(purchaseTransferKey(entity.data), entity);
  }

  for (const body of bodies) {
    const parsed = TePurchaseTransfer.parse({ ...body, update_time: now });
    index.set(purchaseTransferKey(parsed.data), parsed);
  }

  return {
    nextCache: { ...cache, te_purchase_transfer: Array.from(index.values()) },
    updatedCount: bodies.length
  };
}

export const applyBulkTransferPurchaseTransferCacheAtom = atom(
  null,
  (get, set, bodies: readonly Record<string, unknown>[]) => {
    const { nextCache, updatedCount } = applyBulkTransferToPurchaseTransferCache(
      get(masterEntityCacheAtom),
      bodies
    );
    set(masterEntityCacheAtom, nextCache);
    return updatedCount;
  }
);
