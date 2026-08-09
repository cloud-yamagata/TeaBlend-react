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

const buildReceiveKeySet = (cache: MasterEntityCache): Set<string> => {
  const keys = new Set<string>();
  for (const receive of cache.te_purchase_receive) {
    const d = receive.data;
    keys.add(purchaseTeaKey(d.year, d.purchase, d.bid_no));
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

/**
 * 原料チェック: 受入あり・原料未登録 → OFF（原料登録候補）、それ以外 → ON
 * 操作可能なのは OFF（候補）行のみ。
 */
const resolveMaterialCheckbox = (
  hasReceive: boolean,
  hasMaterial: boolean
): Pick<PurchaseTtransferRow, "isSelected" | "isMaterialSelectable"> => {
  const isRegistrationCandidate = hasReceive && !hasMaterial;
  return {
    isSelected: !isRegistrationCandidate,
    isMaterialSelectable: isRegistrationCandidate
  };
};

/** bootstrap キャッシュから一覧行を構築（仕入日・入札NO 昇順） */
export function buildPurchaseTtransferList(
  cache: MasterEntityCache,
  materials: TeMaterial[]
): PurchaseTtransferRow[] {
  const transferByKey = buildTransferQuantityIndex(cache);
  const receiveKeys = buildReceiveKeySet(cache);
  const materialKeys = buildMaterialKeySet(materials);

  const rows: PurchaseTtransferRow[] = cache.te_purchase_tea.map((entity) => {
    const d = entity.data;
    const key = purchaseTeaKey(d.year, d.purchase, d.bid_no);
    const purchaseWeight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    const transferQuantity = transferByKey.get(key) ?? 0;
    const hasTransfer = transferByKey.has(key);
    const status = formatRemainStatus(purchaseWeight, transferQuantity);
    const hasReceive = receiveKeys.has(key);
    const hasMaterial = materialKeys.has(key);
    const materialCheckbox = resolveMaterialCheckbox(hasReceive, hasMaterial);

    return {
      id: key,
      isBulkUpdateSelectable: status === "未",
      ...materialCheckbox,
      hasReceive,
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
