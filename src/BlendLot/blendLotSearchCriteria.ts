/**
 * ブレンドロット登録 … 検索条件（パッケージロット登録と同型）
 */
import { selectedCodesOrNull } from "../Factory2LotManufacture/factory2SearchCriteria";
import type { BlendLotOrganicCheck, BlendLotStatusCheck } from "./types";

export function blendLotStatusCodesFromCheck(checks: BlendLotStatusCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "1", checked: checks.active },
    { code: "2", checked: checks.complete },
    { code: "3", checked: checks.confirm }
  ]);
}

export function blendLotOrganicCodesFromCheck(checks: BlendLotOrganicCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "A", checked: checks.organic },
    { code: "B", checked: checks.pesticideFree },
    { code: "C", checked: checks.general }
  ]);
}

export const defaultBlendLotStatusCheck = (): BlendLotStatusCheck => ({
  active: false,
  complete: false,
  confirm: false
});

export const defaultBlendLotOrganicCheck = (): BlendLotOrganicCheck => ({
  organic: false,
  pesticideFree: false,
  general: false
});
