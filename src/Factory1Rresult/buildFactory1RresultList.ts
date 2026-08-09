/**
 * te_factory1_result × te_factory1_transfer × te_material から一覧行を構築
 *（WPF Resources「第1工場生産実績情報」SQL + Store.status 計算相当）
 */
import type { TeMaterial } from "../MaterialList/types";
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { Factory1RresultRow } from "./types";

const calcWeight = (
  unitWeight: number,
  unitNumber: number,
  fractionWeight: number,
  fractionNumber: number
): number => unitWeight * unitNumber + fractionWeight * fractionNumber;

/** WPF Store.status と同じ残量状況 */
export const formatFactory1RemainStatus = (
  purchaseWeight: number,
  transferQuantity: number
): string => {
  if (transferQuantity === 0) return "未";
  if (purchaseWeight > transferQuantity) return "残";
  if (Math.abs(purchaseWeight - transferQuantity) < 0.005) return "完";
  if (purchaseWeight < transferQuantity) return "誤";
  return "完";
};

type TransferAgg = {
  transferDate: string | null;
  transferQuantity: number;
  transferUnitNumber: number;
  transferFractionNumber: number;
};

const buildTransferIndex = (cache: MasterEntityCache): Map<string, TransferAgg> => {
  const index = new Map<string, TransferAgg>();
  for (const transfer of cache.te_factory1_transfer) {
    const d = transfer.data;
    const lotNo = d.lot_no.trim();
    if (!lotNo) continue;
    index.set(lotNo, {
      transferDate: d.transfer_date || null,
      transferQuantity: calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number),
      transferUnitNumber: d.unit_number,
      transferFractionNumber: d.fraction_number
    });
  }
  return index;
};

/** te_material … purchase='第1工場' かつ purchase_no = lot_no */
const buildMaterialLotSet = (materials: TeMaterial[]): Set<string> => {
  const keys = new Set<string>();
  for (const material of materials) {
    if (material.purchase?.trim() !== "第1工場") continue;
    const purchaseNo = material.purchaseNo?.trim();
    if (!purchaseNo) continue;
    keys.add(purchaseNo);
  }
  return keys;
};

export function buildFactory1RresultList(
  cache: MasterEntityCache,
  materials: TeMaterial[]
): Factory1RresultRow[] {
  const transferByLot = buildTransferIndex(cache);
  const materialLots = buildMaterialLotSet(materials);

  const rows: Factory1RresultRow[] = cache.te_factory1_result.map((entity) => {
    const d = entity.data;
    const lotNo = d.lot_no.trim();
    const purchaseWeight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    const transfer = transferByLot.get(lotNo);
    const transferQuantity = transfer?.transferQuantity ?? 0;
    const hasTransfer = transfer != null;
    const hasMaterial = materialLots.has(lotNo);
    const status = formatFactory1RemainStatus(purchaseWeight, transferQuantity);
    /** SQL is_chk_usable: 未原料登録かつ生産量＝移動量 */
    const isChkUsable =
      !hasMaterial && Math.abs(purchaseWeight - transferQuantity) < 0.005 && transferQuantity > 0;

    return {
      id: lotNo,
      isBulkTransferSelectable: true,
      isMaterialSelectable: isChkUsable,
      hasMaterial,
      hasTransfer,
      lotNo,
      year: d.year,
      workDate: d.work_date || null,
      variety: d.variety ?? "",
      teaLife: d.tea_life ?? "",
      grade: d.grade ?? "",
      teaRank: d.tea_rank ?? "",
      fieldNo: d.field_no ?? "",
      unitWeight: d.unit_weight,
      unitNumber: d.unit_number,
      fractionWeight: d.fraction_weight,
      fractionNumber: d.fraction_number,
      purchaseWeight,
      status,
      transferQuantity: hasTransfer ? transferQuantity : 0,
      transferDate: transfer?.transferDate ?? null,
      transferUnitNumber: transfer?.transferUnitNumber ?? null,
      transferFractionNumber: transfer?.transferFractionNumber ?? null,
      target: (d.target ?? "").trim(),
      remarks: (d.remarks ?? "").trim()
    };
  });

  rows.sort((a, b) => {
    const y = (a.year ?? 0) - (b.year ?? 0);
    if (y !== 0) return y;
    const v = a.variety.localeCompare(b.variety, "ja");
    if (v !== 0) return v;
    const r = a.teaRank.localeCompare(b.teaRank, "ja");
    if (r !== 0) return r;
    return a.fieldNo.localeCompare(b.fieldNo, "ja", { numeric: true });
  });

  return rows;
}
