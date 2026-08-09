/**
 * 仕上品仕入登録成功後のクライアントキャッシュ更新
 * （WPF Regist: te_material_purchase + te_store_transfer + te_lot）
 */
import {
  TeLot,
  TeMaterialPurchase,
  TeStoreTransfer,
  type MasterEntityCache
} from "../domain/masterTableEntityModels";
import type {
  MaterialPurchaseCreateBody,
  MaterialPurchaseCreateResult
} from "../repositories/materialPurchaseRepository";

export function applyMaterialPurchaseCacheCreate(
  cache: MasterEntityCache,
  body: MaterialPurchaseCreateBody,
  result: MaterialPurchaseCreateResult
): MasterEntityCache {
  const purchaseNo = result.purchase_no;

  const purchase = TeMaterialPurchase.parse({
    purchase_no: purchaseNo,
    purchase_date: body.purchase_date,
    item_no: body.item_no,
    item_name: body.item_name,
    purchase_lot_no: body.purchase_lot_no,
    purchase_quantity: body.purchase_quantity,
    supplier: body.supplier
  });

  const nextTransferNo =
    result.transfer_no != null && result.transfer_no > 0
      ? result.transfer_no
      : Math.max(0, ...cache.te_store_transfer.map((t) => t.data.transfer_no)) + 1;

  const transfer = TeStoreTransfer.parse({
    transfer_no: nextTransferNo,
    transfer_date: body.purchase_date,
    item_no: body.item_no,
    product_no: purchaseNo,
    transfer_type: "1",
    result_type: "4",
    lot_no: body.purchase_lot_no,
    lot_type: "2",
    reason: "仕上品仕入",
    store_no: 3,
    store_party_name: body.supplier,
    unit_weight: 0,
    unit_number: 0,
    fraction_weight: 0,
    fraction_number: 0,
    transfer_quantity: body.purchase_quantity,
    unit_type: "Kg",
    remarks: ""
  });

  const nextLotNo =
    result.lot_no != null && result.lot_no > 0
      ? result.lot_no
      : Math.max(0, ...cache.te_lot.map((l) => l.data.lot_no)) + 1;

  const lot = TeLot.parse({
    lot_no: nextLotNo,
    product_no: purchaseNo,
    work_date: body.purchase_date,
    process_type: "08",
    process_name: "仕上品仕入",
    lot_name: body.purchase_lot_no,
    lot_description: body.item_name
  });

  return {
    ...cache,
    te_material_purchase: [...cache.te_material_purchase, purchase],
    te_store_transfer: [...cache.te_store_transfer, transfer],
    te_lot: [...cache.te_lot, lot]
  };
}
