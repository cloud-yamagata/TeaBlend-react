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

type BlendLotSearchEnabledArgs = {
  yearFilterEnabled: boolean;
  year: string;
  lotStatusCheck: BlendLotStatusCheck;
  organicCheck: BlendLotOrganicCheck;
  workDate: string;
  itemNo: string;
  itemName: string;
};

/**
 * 検索ボタン活性
 * - 年度チェック ON: 年度あり、または他条件あり
 * - 年度チェック OFF: 他条件なしでも可（全年度）
 */
export function isBlendLotSearchEnabled({
  yearFilterEnabled,
  year,
  lotStatusCheck,
  organicCheck,
  workDate,
  itemNo,
  itemName
}: BlendLotSearchEnabledArgs): boolean {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    anyInGroup(lotStatusCheck) ||
    anyInGroup(organicCheck) ||
    workDate.trim() !== "" ||
    itemNo.trim() !== "" ||
    itemName.trim() !== ""
  );
}
