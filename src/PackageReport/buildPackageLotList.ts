/**
 * te_package_base_new から製造報告書一覧行を構築
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { TePackageLotPartInfo } from "../domain/packageReportEntities";
import { formatPackageLotStatus, formatPackageOrganicClass } from "./packageLotDisplay";
import type { PackageLotRegistRow } from "./types";

const sumLotPartOutQuantities = (parts: TePackageLotPartInfo[] | null): number | null => {
  if (!parts?.length) return null;
  let total = 0;
  let any = false;
  for (const part of parts) {
    const v = part.out_quantity;
    if (v == null || !Number.isFinite(v)) continue;
    total += v;
    any = true;
  }
  return any ? total : null;
};

export function buildPackageLotList(cache: MasterEntityCache): PackageLotRegistRow[] {
  const rows: PackageLotRegistRow[] = cache.te_package_base_new.map((pkg) => {
    const d = pkg.data;
    const statusCode = d.lot_status.trim();
    return {
      id: String(d.product_no),
      workDate: d.work_date,
      lotStatus: formatPackageLotStatus(statusCode),
      lotStatusCode: statusCode,
      productNo: d.product_no,
      itemNo: d.item_no,
      organicClassCode: d.organic_class,
      organicName: formatPackageOrganicClass(d.organic_class),
      productName: d.product_name,
      completeQuantity: d.complete_quantity,
      gradeNo: null,
      partName: d.part_name ?? "",
      useQuantity: sumLotPartOutQuantities(d.lot_part_info)
    };
  });

  rows.sort((a, b) => (a.productNo ?? 0) - (b.productNo ?? 0));
  return rows;
}
