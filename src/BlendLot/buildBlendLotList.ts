/**
 * te_blend_lot からブレンドロット一覧行を構築
 */
import { formatPackageLotStatus, formatPackageOrganicClass } from "../PackageReport/packageLotDisplay";
import type { BlendLotListRow, TeBlendLot } from "./types";

export function buildBlendLotList(lots: TeBlendLot[]): BlendLotListRow[] {
  const rows: BlendLotListRow[] = lots.map((lot) => {
    const statusCode = (lot.lotStatus ?? "").trim();
    const organicCode = (lot.organicClass ?? "").trim();
    return {
      id: String(lot.productNo ?? ""),
      workDate: lot.workDate,
      lotStatus: formatPackageLotStatus(statusCode),
      lotStatusCode: statusCode,
      productNo: lot.productNo,
      itemNo: lot.itemNo,
      organicClassCode: organicCode,
      organicName: formatPackageOrganicClass(organicCode),
      itemName: lot.itemName ?? "",
      unitWeight: lot.unitWeight,
      remarks: lot.remarks ?? ""
    };
  });

  rows.sort((a, b) => (a.productNo ?? 0) - (b.productNo ?? 0));
  return rows;
}

export function findBlendLotByListRowId(lots: TeBlendLot[], rowId: string | null): TeBlendLot | null {
  if (!rowId) return null;
  return lots.find((lot) => String(lot.productNo ?? "") === rowId) ?? null;
}
