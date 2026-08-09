/**
 * 製造報告書・削除時のクライアントキャッシュ更新
 *
 * ① te_package_base_new DELETE（product_no）
 * ② te_package_categorys_new DELETE（product_no）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";

export function applyPackageLotCacheDelete(
  cache: MasterEntityCache,
  productNo: number
): MasterEntityCache {
  return {
    ...cache,
    te_package_base_new: cache.te_package_base_new.filter((row) => row.data.product_no !== productNo),
    te_package_categorys_new: cache.te_package_categorys_new.filter(
      (row) => row.data.product_no !== productNo
    )
  };
}
