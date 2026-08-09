/**
 * te_material_result × te_material から一覧行を構築
 *（WPF Resources「原料実績情報」SQL 相当）
 */
import type { TeMaterial } from "../MaterialList/types";
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { normalizeDateToYmd } from "../lib/searchNormalize";
import { materialRresultRowId, type MaterialRresultRow } from "./types";

const calcWeight = (
  unitWeight: number,
  unitNumber: number,
  fractionWeight: number,
  fractionNumber: number
): number => unitWeight * unitNumber + fractionWeight * fractionNumber;

/** JOIN: year + purchase_date + purchase + purchase_no(=product_no) + tea_rank */
const materialJoinKey = (
  year: number | null,
  purchase: string | null,
  purchaseDate: string | null,
  purchaseNo: string | null,
  teaRank: string | null
): string | null => {
  if (year == null || !purchase?.trim() || !purchaseNo?.trim() || !teaRank?.trim()) return null;
  const date = normalizeDateToYmd(purchaseDate);
  if (!date) return null;
  return `${year}|${purchase.trim()}|${date}|${purchaseNo.trim()}|${teaRank.trim()}`;
};

const buildMaterialKeySet = (materials: TeMaterial[]): Set<string> => {
  const keys = new Set<string>();
  for (const material of materials) {
    const key = materialJoinKey(
      material.year,
      material.purchase,
      material.purchaseDate,
      material.purchaseNo,
      material.teaRank
    );
    if (key) keys.add(key);
  }
  return keys;
};

export function buildMaterialRresultList(
  cache: MasterEntityCache,
  materials: TeMaterial[]
): MaterialRresultRow[] {
  const materialKeys = buildMaterialKeySet(materials);

  const rows: MaterialRresultRow[] = cache.te_material_result.map((entity) => {
    const d = entity.data;
    const purchaseDate = d.purchase_date || null;
    const purchaseWeight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    const joinKey = materialJoinKey(d.year, d.purchase, purchaseDate, d.product_no, d.tea_rank);
    const hasMaterial = joinKey != null && materialKeys.has(joinKey);
    const status = hasMaterial ? "完" : "未";
    const isChkUsable = !hasMaterial;

    return {
      id: materialRresultRowId(
        d.year,
        d.purchase,
        d.product_no,
        normalizeDateToYmd(purchaseDate) ?? purchaseDate ?? "",
        d.tea_rank,
        d.rank
      ),
      isMaterialSelectable: isChkUsable,
      hasMaterial,
      year: d.year,
      purchase: d.purchase ?? "",
      purchaseDate,
      productNo: d.product_no ?? "",
      teaRank: d.tea_rank ?? "",
      rank: d.rank ?? "",
      teaType: d.tea_type ?? "",
      teaLife: d.tea_life ?? "",
      organicClass: d.organic_class ?? "",
      producer: d.producer ?? "",
      materialName: d.material_name ?? "",
      unitWeight: d.unit_weight,
      unitNumber: d.unit_number,
      fractionWeight: d.fraction_weight,
      fractionNumber: d.fraction_number,
      purchaseWeight,
      status,
      remarks: (d.remarks ?? "").trim()
    };
  });

  rows.sort((a, b) => {
    const y = (a.year ?? 0) - (b.year ?? 0);
    if (y !== 0) return y;
    const d = (a.purchaseDate ?? "").localeCompare(b.purchaseDate ?? "");
    if (d !== 0) return d;
    const p = a.purchase.localeCompare(b.purchase, "ja");
    if (p !== 0) return p;
    const n = a.productNo.localeCompare(b.productNo, "ja", { numeric: true });
    if (n !== 0) return n;
    return a.teaRank.localeCompare(b.teaRank, "ja");
  });

  return rows;
}
