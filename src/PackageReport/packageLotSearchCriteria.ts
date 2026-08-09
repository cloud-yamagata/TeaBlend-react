/**
 * パッケージロット登録 … 2段目検索条件（ロット製造実績一覧と同型・工程なし）
 */
import { selectedCodesOrNull } from "../Factory2LotManufacture/factory2SearchCriteria";
import type { PackageLotOrganicCheck, PackageLotStatusCheck } from "./types";

export function packageLotStatusCodesFromCheck(checks: PackageLotStatusCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "1", checked: checks.active },
    { code: "4", checked: checks.measure },
    { code: "2", checked: checks.complete },
    { code: "3", checked: checks.confirm }
  ]);
}

export function packageLotOrganicCodesFromCheck(checks: PackageLotOrganicCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "A", checked: checks.organic },
    { code: "B", checked: checks.pesticideFree },
    { code: "C", checked: checks.general }
  ]);
}

/** 検索ボタン活性: 状態・有機のいずれかON、製造日、商品No、商品名のいずれか */
export function isPackageLotSearchEnabled(
  lotStatusCheck: PackageLotStatusCheck,
  organicCheck: PackageLotOrganicCheck,
  workDate: string,
  itemNo: string,
  productName: string
): boolean {
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    anyInGroup(lotStatusCheck) ||
    anyInGroup(organicCheck) ||
    workDate.trim() !== "" ||
    itemNo.trim() !== "" ||
    productName.trim() !== ""
  );
}
