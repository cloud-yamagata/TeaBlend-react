/**
 * te_purchase_tea（＋ te_purchase_transfer 集計）から仕入実績情報一覧行を構築
 */
import type { TeMaterial } from "../MaterialList/types";
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { PurchaseTtransferRow } from "./types";

const purchaseTeaKey = (year: number, purchase: string, bidNo: string): string =>
  `${year}|${purchase}|${bidNo}`;

/** 一覧行 ID（te_purchase_tea キー） */
export const purchaseTtransferRowId = purchaseTeaKey;

const calcWeight = (
  unitWeight: number,
  unitNumber: number,
  fractionWeight: number,
  fractionNumber: number
): number => unitWeight * unitNumber + fractionWeight * fractionNumber;

const formatRemainStatus = (purchaseWeight: number, transferQuantity: number): string => {
  if (transferQuantity <= 0) return "未";
  if (transferQuantity < purchaseWeight) return "残";
  if (Math.abs(transferQuantity - purchaseWeight) < 0.005) return "完";
  if (transferQuantity > purchaseWeight) return "誤";
  return "完";
};

const buildTransferQuantityIndex = (cache: MasterEntityCache): Map<string, number> => {
  const index = new Map<string, number>();
  for (const transfer of cache.te_purchase_transfer) {
    const d = transfer.data;
    const key = purchaseTeaKey(d.year, d.purchase, d.bid_no);
    const weight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    index.set(key, (index.get(key) ?? 0) + weight);
  }
  return index;
};

/**
 * WPF is_chk_usable 前段相当。
 * te_purchase_transfer.result_type='1'（工場＝第２工場）の重量合計 > 0 のキー。
 * （キャッシュ側判定。サーバー SQL は変更しない）
 */
const buildFactoryTransferKeySet = (cache: MasterEntityCache): Set<string> => {
  const weightByKey = new Map<string, number>();
  for (const transfer of cache.te_purchase_transfer) {
    const d = transfer.data;
    if (d.result_type !== "1") continue;
    const key = purchaseTeaKey(d.year, d.purchase, d.bid_no);
    const weight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    weightByKey.set(key, (weightByKey.get(key) ?? 0) + weight);
  }
  const keys = new Set<string>();
  for (const [key, weight] of weightByKey) {
    if (weight > 0) keys.add(key);
  }
  return keys;
};

/** te_material … purchaseNo = te_purchase_tea.bid_no */
const buildMaterialKeySet = (materials: TeMaterial[]): Set<string> => {
  const keys = new Set<string>();
  for (const material of materials) {
    if (material.year == null || !material.purchase?.trim() || !material.purchaseNo?.trim()) {
      continue;
    }
    keys.add(purchaseTeaKey(material.year, material.purchase.trim(), material.purchaseNo.trim()));
  }
  return keys;
};

/** 原料チェック操作可否（工場振分あり・原料未登録） */
const resolveMaterialSelectable = (hasFactoryTransfer: boolean, hasMaterial: boolean): boolean =>
  hasFactoryTransfer && !hasMaterial;

/** bootstrap キャッシュから一覧行を構築（仕入日・入札NO 昇順） */
export function buildPurchaseTtransferList(
  cache: MasterEntityCache,
  materials: TeMaterial[]
): PurchaseTtransferRow[] {
  const transferByKey = buildTransferQuantityIndex(cache);
  const factoryTransferKeys = buildFactoryTransferKeySet(cache);
  const materialKeys = buildMaterialKeySet(materials);

  const rows: PurchaseTtransferRow[] = cache.te_purchase_tea.map((entity) => {
    const d = entity.data;
    const key = purchaseTeaKey(d.year, d.purchase, d.bid_no);
    const purchaseWeight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    const transferQuantity = transferByKey.get(key) ?? 0;
    const hasTransfer = transferByKey.has(key);
    const status = formatRemainStatus(purchaseWeight, transferQuantity);
    const hasFactoryTransfer = factoryTransferKeys.has(key);
    const hasMaterial = materialKeys.has(key);
    return {
      id: key,
      isBulkUpdateSelectable: true,
      isMaterialSelectable: resolveMaterialSelectable(hasFactoryTransfer, hasMaterial),
      hasFactoryTransfer,
      hasMaterial,
      hasTransfer,
      year: d.year,
      bidNo: d.bid_no,
      purchaseDate: d.purchase_date,
      purchase: d.purchase,
      variety: d.variety ?? "",
      teaLife: d.tea_life ?? "",
      grade: d.grade ?? "",
      teaType: d.tea_type ?? "",
      teaRank: d.tea_rank ?? "",
      fieldNo: d.field_no ?? "",
      producer: d.producer ?? "",
      unitWeight: d.unit_weight,
      unitNumber: d.unit_number,
      fractionWeight: d.fraction_weight,
      fractionNumber: d.fraction_number,
      purchaseWeight,
      cost: d.cost,
      discount: d.discount,
      status,
      transferQuantity,
      target: d.target ?? "",
      targetPlan: d.target_plan ?? "",
      lotNo: d.lot_no?.trim() ?? ""
    };
  });

  rows.sort((a, b) => {
    const dateCmp = (a.purchaseDate ?? "").localeCompare(b.purchaseDate ?? "", "ja");
    if (dateCmp !== 0) return dateCmp;
    return a.bidNo.localeCompare(b.bidNo, "ja", { numeric: true });
  });

  return rows;
}
