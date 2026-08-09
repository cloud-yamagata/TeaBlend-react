/**
 * 製造報告書・在庫確定時のクライアントキャッシュ更新
 *
 * ① te_package_base_new UPDATE（lot_status = 3）
 * ② te_store_transfer INSERT（使用ロット数分・最大3行）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TeStoreTransfer } from "../domain/masterTableEntityModels";
import { TePackageBaseNew } from "../domain/packageReportEntities";
import type { PackageLotConfirmStockApiBody } from "./collectPackageLotEditPayload";
import { buildStoreTransferCacheRecord } from "./collectPackageLotEditPayload";
import { PACKAGE_LOT_STATUS_CONFIRMED } from "./packageLotDisplay";

export function applyPackageLotCacheConfirmStock(
  cache: MasterEntityCache,
  productNo: number,
  body: PackageLotConfirmStockApiBody,
  transferNos: number[]
): MasterEntityCache {
  if (transferNos.length !== body.transfer_rows.length) {
    throw new Error("入出庫NOの件数が使用ロット行数と一致しません。");
  }

  const newTransfers = body.transfer_rows.map((row, index) =>
    TeStoreTransfer.parse(buildStoreTransferCacheRecord(transferNos[index]!, row))
  );

  return {
    ...cache,
    te_package_base_new: cache.te_package_base_new.map((row) => {
      if (row.data.product_no !== productNo) return row;
      return TePackageBaseNew.parse({
        ...row.data,
        lot_status: PACKAGE_LOT_STATUS_CONFIRMED
      });
    }),
    te_store_transfer: [...cache.te_store_transfer, ...newTransfers]
  };
}
