import { atom } from "jotai";
import { fetchAllTrConstants } from "../repositories/constantRepository";
import { masterTrConstantsAtom } from "../repository/masterData";

/** tr_constant を再取得して bootstrap キャッシュを更新 */
export const refreshTrConstantCorrectMasterAtom = atom(null, async (_get, set) => {
  const rows = await fetchAllTrConstants();
  set(masterTrConstantsAtom, rows);
});
