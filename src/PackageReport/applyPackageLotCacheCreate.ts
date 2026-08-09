/**
 * 製造報告書・新規登録時のクライアントキャッシュ更新
 *
 * ① te_package_base_new INSERT
 * ② te_package_categorys_new INSERT
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { TePackageBaseNew, TePackageCategorysNew } from "../domain/packageReportEntities";
import type { PackageLotMutationPayload } from "./collectPackageLotEditPayload";

export function applyPackageLotCacheCreate(
  cache: MasterEntityCache,
  payload: PackageLotMutationPayload
): MasterEntityCache {
  const newBase = TePackageBaseNew.parse(payload.baseRecord);
  const newCategorys = TePackageCategorysNew.parse(payload.categorysRecord);

  return {
    ...cache,
    te_package_base_new: [...cache.te_package_base_new, newBase],
    te_package_categorys_new: [...cache.te_package_categorys_new, newCategorys]
  };
}
