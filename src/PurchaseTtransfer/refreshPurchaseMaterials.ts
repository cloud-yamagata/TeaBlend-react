import { atom } from "jotai";
import { masterMaterialsAtom } from "../repository/masterData";
import { fetchMaterials } from "../repositories/materialRepository";

/** te_material を再取得して原料キャッシュを更新 */
export const refreshPurchaseMaterialsAtom = atom(null, async (_get, set) => {
  const materials = await fetchMaterials();
  set(masterMaterialsAtom, materials);
});
