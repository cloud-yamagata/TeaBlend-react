/**
 * 仕上品仕入更新成功後のクライアントキャッシュ更新
 * te_material_purchase のみ（te_store_transfer / te_lot は更新しない）
 */
import { TeMaterialPurchase, type MasterEntityCache } from "../domain/masterTableEntityModels";
import type { MaterialPurchaseUpdateBody } from "../repositories/materialPurchaseRepository";

export function applyMaterialPurchaseCacheUpdate(
  cache: MasterEntityCache,
  body: MaterialPurchaseUpdateBody
): MasterEntityCache {
  const purchaseNo = body.purchase_no;
  const nextPurchase = TeMaterialPurchase.parse({
    purchase_no: purchaseNo,
    purchase_date: body.purchase_date,
    item_no: body.item_no,
    item_name: body.item_name,
    purchase_lot_no: body.purchase_lot_no,
    purchase_quantity: body.purchase_quantity,
    supplier: body.supplier
  });

  return {
    ...cache,
    te_material_purchase: cache.te_material_purchase.map((row) =>
      row.data.purchase_no === purchaseNo ? nextPurchase : row
    )
  };
}
