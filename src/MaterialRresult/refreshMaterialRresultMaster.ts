import { atom } from "jotai";
import { mergeParsedTable } from "../domain/masterTableEntityModels";
import { masterEntityCacheAtom, masterMaterialsAtom } from "../repository/masterData";
import { fetchMaterials } from "../repositories/materialRepository";
import { fetchMaterialResultRows } from "../repositories/materialResultRepository";

/** te_material_result / te_material を再取得してキャッシュを更新 */
export const refreshMaterialRresultMasterAtom = atom(null, async (_get, set) => {
  const [resultRows, materials] = await Promise.all([fetchMaterialResultRows(), fetchMaterials()]);
  let cache = _get(masterEntityCacheAtom);
  cache = mergeParsedTable(cache, "te_material_result", resultRows);
  set(masterEntityCacheAtom, cache);
  set(masterMaterialsAtom, materials);
});
