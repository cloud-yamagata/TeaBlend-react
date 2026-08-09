/**
 * te_purchase_tea × te_purchase_transfer(result_type=1) × te_purchase_receive 集計
 * （PurchaseReceive Resources.resx「仕入実績情報」SQL 相当）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { PurchaseReceiveDetailRow, PurchaseReceiveRow } from "./types";

const teaKey = (year: number, purchase: string, bidNo: string): string => `${year}|${purchase}|${bidNo}`;

const rowId = (year: number, purchase: string, bidNo: string, resultType: string, transfer: string): string =>
  `${year}|${purchase}|${bidNo}|${resultType}|${transfer}`;

const calcWeight = (
  unitWeight: number,
  unitNumber: number,
  fractionWeight: number,
  fractionNumber: number
): number => unitWeight * unitNumber + fractionWeight * fractionNumber;

/** WPF SQL case 式と同じ残量状況 */
export const formatReceiveStatus = (transferQuantity: number, receiveQuantity: number): string => {
  if (receiveQuantity <= 0) return "未";
  if (transferQuantity > receiveQuantity) return "残";
  if (Math.abs(transferQuantity - receiveQuantity) < 0.005) return "完";
  if (transferQuantity < receiveQuantity) return "誤";
  return "";
};

const buildReceiveQuantityIndex = (cache: MasterEntityCache): Map<string, number> => {
  const index = new Map<string, number>();
  for (const receive of cache.te_purchase_receive) {
    const d = receive.data;
    const key = teaKey(d.year, d.purchase, d.bid_no);
    const weight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    index.set(key, (index.get(key) ?? 0) + weight);
  }
  return index;
};

export function buildPurchaseReceiveList(cache: MasterEntityCache): PurchaseReceiveRow[] {
  const teaByKey = new Map<string, (typeof cache.te_purchase_tea)[number]>();
  for (const tea of cache.te_purchase_tea) {
    const d = tea.data;
    teaByKey.set(teaKey(d.year, d.purchase, d.bid_no), tea);
  }

  const receiveByKey = buildReceiveQuantityIndex(cache);
  const rows: PurchaseReceiveRow[] = [];

  for (const transfer of cache.te_purchase_transfer) {
    const t = transfer.data;
    if (t.result_type !== "1") continue;

    const tea = teaByKey.get(teaKey(t.year, t.purchase, t.bid_no));
    if (!tea) continue;

    const d = tea.data;
    const key = teaKey(t.year, t.purchase, t.bid_no);
    const transferQuantity = calcWeight(t.unit_weight, t.unit_number, t.fraction_weight, t.fraction_number);
    const receiveQuantity = receiveByKey.get(key) ?? 0;
    const status = formatReceiveStatus(transferQuantity, receiveQuantity);

    rows.push({
      id: rowId(t.year, t.purchase, t.bid_no, t.result_type, t.transfer),
      year: t.year,
      bidNo: t.bid_no,
      purchaseDate: d.purchase_date,
      purchase: t.purchase,
      variety: d.variety ?? "",
      teaLife: d.tea_life ?? "",
      grade: d.grade ?? "",
      teaType: d.tea_type ?? "",
      teaRank: d.tea_rank ?? "",
      fieldNo: d.field_no ?? "",
      producer: d.producer ?? "",
      unitWeight: t.unit_weight,
      unitNumber: t.unit_number,
      fractionWeight: t.fraction_weight,
      fractionNumber: t.fraction_number,
      transferQuantity,
      status,
      receiveQuantity,
      target: d.target ?? "",
      targetPlan: d.target_plan ?? "",
      lotNo: d.lot_no?.trim() ?? "",
      transfer: t.transfer,
      resultType: t.result_type
    });
  }

  rows.sort((a, b) => {
    const dateCmp = (a.purchaseDate ?? "").localeCompare(b.purchaseDate ?? "", "ja");
    if (dateCmp !== 0) return dateCmp;
    return a.bidNo.localeCompare(b.bidNo, "ja", { numeric: true });
  });

  return rows;
}

/** 選択行の受入明細（SubWindow 相当） */
export function buildPurchaseReceiveDetails(
  cache: MasterEntityCache,
  year: number,
  purchase: string,
  bidNo: string
): PurchaseReceiveDetailRow[] {
  const rows: PurchaseReceiveDetailRow[] = cache.te_purchase_receive
    .filter((r) => r.data.year === year && r.data.purchase === purchase && r.data.bid_no === bidNo)
    .map((entity) => {
      const d = entity.data;
      return {
        id: `${d.year}|${d.purchase}|${d.bid_no}|${d.receive_date}`,
        year: d.year,
        purchase: d.purchase,
        bidNo: d.bid_no,
        receiveDate: d.receive_date,
        unitWeight: d.unit_weight,
        unitNumber: d.unit_number,
        fractionWeight: d.fraction_weight,
        fractionNumber: d.fraction_number,
        transferQuantity: calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number),
        remarks: d.remarks ?? ""
      };
    });

  rows.sort((a, b) => a.receiveDate.localeCompare(b.receiveDate, "ja"));
  return rows;
}
