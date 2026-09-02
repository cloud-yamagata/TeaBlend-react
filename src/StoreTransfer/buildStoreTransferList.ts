/**
 * te_store_transfer（store_no=3）から第3工場入出庫実績一覧行を構築
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { lotTypeName, resultTypeName, transferTypeName } from "./storeTransferDisplay";
import { FACTORY3_STORE_NO, type StoreTransferRow } from "./types";

export const storeTransferRowId = (transferNo: number): string => String(transferNo);

/** bootstrap キャッシュから一覧行を構築（入出庫No 昇順・第3工場のみ） */
export function buildStoreTransferList(cache: MasterEntityCache): StoreTransferRow[] {
  const rows = cache.te_store_transfer
    .filter((entity) => entity.data.store_no === FACTORY3_STORE_NO)
    .map((entity) => {
      const d = entity.data;
      return {
        id: storeTransferRowId(d.transfer_no),
        transferNo: d.transfer_no,
        transferDate: d.transfer_date || null,
        itemNo: d.item_no,
        productNo: d.product_no,
        lotNo: d.lot_no?.trim() ?? "",
        storeNo: d.store_no,
        storePartyName: d.store_party_name?.trim() ?? "",
        transferType: d.transfer_type,
        transferTypeName: transferTypeName(d.transfer_type),
        resultType: d.result_type,
        resultTypeName: resultTypeName(d.result_type),
        lotType: d.lot_type,
        lotTypeName: lotTypeName(d.lot_type),
        reason: d.reason?.trim() ?? "",
        unitWeight: d.unit_weight,
        unitNumber: d.unit_number,
        fractionWeight: d.fraction_weight,
        fractionNumber: d.fraction_number,
        transferQuantity: d.transfer_quantity,
        unitType: d.unit_type?.trim() ?? "",
        remarks: d.remarks?.trim() ?? ""
      } satisfies StoreTransferRow;
    });

  return rows.sort((a, b) => a.transferNo - b.transferNo);
}
