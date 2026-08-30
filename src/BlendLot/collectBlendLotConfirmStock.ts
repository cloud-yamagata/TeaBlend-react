/**
 * ブレンドロット在庫確定 … API ボディ生成と te_store_transfer キャッシュ行
 */
import type { TeBlendLot } from "./types";
import { parsePartItems, type BlendLotPartItem } from "./blendLotDisplayUtils";

export type BlendLotConfirmStockApiBody = {
  product_no: number;
};

const STORE_NO = 3;

const toTransferDateIso = (workDate: string | null): string => {
  const trimmed = (workDate ?? "").trim();
  if (!trimmed) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}T00:00:00`;
  }
  const datePart = trimmed.includes("T") ? trimmed.slice(0, 10) : trimmed.slice(0, 10);
  return `${datePart}T00:00:00`;
};

const formatFinishedLotNo = (organicClass: string, productNo: number): string =>
  `${organicClass.trim()}${String(productNo).padStart(5, "0")}`;

const formatPartLotNo = (itemGroupNo: string, productNo: number): string =>
  `${itemGroupNo.trim()}-${String(productNo).padStart(5, "0")}`;

export function collectBlendLotConfirmStockApiBody(lot: TeBlendLot): BlendLotConfirmStockApiBody {
  const productNo = lot.productNo;
  if (productNo == null || productNo <= 0) {
    throw new Error("製造Noが不正です。");
  }
  return { product_no: productNo };
};

export function buildBlendLotFinishedTransferCacheRecord(
  transferNo: number,
  lot: TeBlendLot
): Record<string, unknown> {
  const productNo = lot.productNo ?? 0;
  const unitWeight = lot.unitWeight ?? 0;
  const organicClass = (lot.organicClass ?? "").trim();

  return {
    transfer_no: transferNo,
    transfer_date: toTransferDateIso(lot.workDate),
    item_no: lot.itemNo ?? 0,
    product_no: productNo,
    transfer_type: "1",
    result_type: "1",
    lot_no: formatFinishedLotNo(organicClass, productNo),
    lot_type: "2",
    reason: "通常品生産",
    store_no: STORE_NO,
    store_party_name: "",
    unit_weight: unitWeight,
    unit_number: 1,
    fraction_weight: 0,
    fraction_number: 0,
    transfer_quantity: unitWeight,
    unit_type: "Kg",
    remarks: lot.remarks ?? ""
  };
}

export function buildBlendLotPartTransferCacheRecord(
  transferNo: number,
  lot: TeBlendLot,
  part: BlendLotPartItem
): Record<string, unknown> {
  const productNo = part.productNo ?? 0;
  const itemGroupNo = (part.itemGroupNo ?? "").trim();
  const useQuantity = part.useQuantity ?? 0;

  return {
    transfer_no: transferNo,
    transfer_date: toTransferDateIso(lot.workDate),
    item_no: part.itemNo ?? 0,
    product_no: productNo,
    transfer_type: "2",
    result_type: "2",
    lot_no: formatPartLotNo(itemGroupNo, productNo),
    lot_type: "2",
    reason: "通常品使用",
    store_no: STORE_NO,
    store_party_name: "",
    unit_weight: 0,
    unit_number: 1,
    fraction_weight: 0,
    fraction_number: 0,
    transfer_quantity: useQuantity,
    unit_type: "Kg",
    remarks: ""
  };
}

export function buildBlendLotConfirmStockCacheRecords(
  lot: TeBlendLot,
  transferNos: number[]
): Record<string, unknown>[] {
  const parts = parsePartItems(lot.lotPartInfo);
  const expectedCount = 1 + parts.length;
  if (transferNos.length !== expectedCount) {
    throw new Error("入出庫NOの件数が期待値と一致しません。");
  }

  const records: Record<string, unknown>[] = [
    buildBlendLotFinishedTransferCacheRecord(transferNos[0]!, lot)
  ];
  parts.forEach((part, index) => {
    records.push(buildBlendLotPartTransferCacheRecord(transferNos[index + 1]!, lot, part));
  });
  return records;
}
