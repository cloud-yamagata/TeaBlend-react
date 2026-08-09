/**
 * te_purchase_transfer × te_purchase_tea 結合行を構築（PurchaseResaleList SQL 相当）
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { PurchaseResaleListRow } from "./types";

const calcWeight = (
  unitWeight: number,
  unitNumber: number,
  fractionWeight: number,
  fractionNumber: number
): number => unitWeight * unitNumber + fractionWeight * fractionNumber;

const transferRowId = (
  year: number,
  purchase: string,
  bidNo: string,
  resultType: string,
  transfer: string
): string => `${year}|${purchase}|${bidNo}|${resultType}|${transfer}`;

/** bootstrap キャッシュから振分実績一覧行を構築 */
export function buildPurchaseResaleList(cache: MasterEntityCache): PurchaseResaleListRow[] {
  const teaByKey = new Map<string, (typeof cache.te_purchase_tea)[number]>();
  for (const tea of cache.te_purchase_tea) {
    const d = tea.data;
    teaByKey.set(`${d.year}|${d.purchase}|${d.bid_no}`, tea);
  }

  const rows: PurchaseResaleListRow[] = [];
  for (const transfer of cache.te_purchase_transfer) {
    const t = transfer.data;
    const tea = teaByKey.get(`${t.year}|${t.purchase}|${t.bid_no}`);
    if (!tea) continue;

    const d = tea.data;
    const transferWeight = calcWeight(t.unit_weight, t.unit_number, t.fraction_weight, t.fraction_number);
    const transferNumber = t.unit_number + t.fraction_number;
    const purchaseWeight = calcWeight(d.unit_weight, d.unit_number, d.fraction_weight, d.fraction_number);
    const purchaseNumber = d.unit_number + d.fraction_number;

    rows.push({
      id: transferRowId(t.year, t.purchase, t.bid_no, t.result_type, t.transfer),
      year: t.year,
      purchase: t.purchase,
      bidNo: t.bid_no,
      transfer: t.transfer,
      transferDate: t.transfer_date,
      unitWeight: t.unit_weight,
      unitNumber: t.unit_number,
      fractionWeight: t.fraction_weight,
      fractionNumber: t.fraction_number,
      transferWeight,
      transferNumber,
      unitPrice: t.unit_price,
      purchaseDate: d.purchase_date,
      variety: d.variety ?? "",
      teaLife: d.tea_life ?? "",
      grade: d.grade ?? "",
      teaType: d.tea_type ?? "",
      teaRank: d.tea_rank ?? "",
      fieldNo: d.field_no ?? "",
      producer: d.producer ?? "",
      discount: d.discount,
      purchaseWeight,
      purchaseNumber,
      target: d.target ?? "",
      targetPlan: d.target_plan ?? "",
      lotNo: d.lot_no?.trim() ?? "",
      cost: d.cost,
      remarks: d.remarks ?? ""
    });
  }

  rows.sort((a, b) => {
    const yearCmp = a.year - b.year;
    if (yearCmp !== 0) return yearCmp;
    const dateCmp = a.transferDate.localeCompare(b.transferDate, "ja");
    if (dateCmp !== 0) return dateCmp;
    const purchaseCmp = a.purchase.localeCompare(b.purchase, "ja");
    if (purchaseCmp !== 0) return purchaseCmp;
    const bidCmp = a.bidNo.localeCompare(b.bidNo, "ja", { numeric: true });
    if (bidCmp !== 0) return bidCmp;
    return a.transfer.localeCompare(b.transfer, "ja");
  });

  return rows;
}
