/**
 * 製造報告書・変更時のクライアントキャッシュ更新
 *
 * ① te_package_base_new UPDATE（product_no）
 * ② te_package_categorys_new UPDATE（product_no、無ければ INSERT）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TePackageBaseNew, TePackageCategorysNew } from "../domain/packageReportEntities";
import type { PackageLotMutationPayload } from "./collectPackageLotEditPayload";

export function applyPackageLotCacheUpdate(
  cache: MasterEntityCache,
  payload: PackageLotMutationPayload
): MasterEntityCache {
  const { product_no: productNo } = payload;
  const updatedBase = TePackageBaseNew.parse(payload.baseRecord);
  const updatedCategorys = TePackageCategorysNew.parse(payload.categorysRecord);

  const hasCategorys = cache.te_package_categorys_new.some((c) => c.data.product_no === productNo);

  return {
    ...cache,
    te_package_base_new: cache.te_package_base_new.map((row) =>
      row.data.product_no === productNo ? updatedBase : row
    ),
    te_package_categorys_new: hasCategorys
      ? cache.te_package_categorys_new.map((row) =>
          row.data.product_no === productNo ? updatedCategorys : row
        )
      : [...cache.te_package_categorys_new, updatedCategorys]
  };
}
