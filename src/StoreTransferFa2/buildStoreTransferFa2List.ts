/**
 * te_store_transfer_fa2 から第2工場入出庫実績一覧行を構築
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import {
  lotTypeName,
  processTypeName,
  resultTypeName,
  transferTypeName
} from "./storeTransferFa2Display";
import type { StoreTransferFa2Row } from "./types";

export const storeTransferFa2RowId = (transferNo: number): string => String(transferNo);

/** bootstrap キャッシュから一覧行を構築（入出庫No 昇順） */
export function buildStoreTransferFa2List(cache: MasterEntityCache): StoreTransferFa2Row[] {
  const rows = cache.te_store_transfer_fa2.map((entity) => {
    const d = entity.data;
    return {
      id: storeTransferFa2RowId(d.transfer_no),
      transferNo: d.transfer_no,
      transferDate: d.transfer_date || null,
      lotNo: d.lot_no,
      lotName: d.lot_name?.trim() ?? "",
      processType: d.process_type,
      processTypeName: processTypeName(d.process_type),
      productNo: d.product_no,
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
    } satisfies StoreTransferFa2Row;
  });

  return rows.sort((a, b) => a.transferNo - b.transferNo);
}
