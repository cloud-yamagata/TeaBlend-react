/**
 * ブレンドロット一覧・部品表の表示用ユーティリティ
 */
import type { TeBlendLot } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP");

/** lot_part_info 配列の1要素 */
export type BlendLotPartItem = {
  id: string;
  partLotNo: string | null;
  organicClass: string | null;
  itemGroupNo: string | null;
  useQuantity: number | null;
};

/** 登録モーダル … 部品1行分の入力 */
export type BlendLotPartInputForm = {
  partLotNo: string;
  organicClass: string;
  itemGroupNo: string;
  useQuantity: string;
};

export const emptyPartInput = (): BlendLotPartInputForm => ({
  partLotNo: "",
  organicClass: "",
  itemGroupNo: "",
  useQuantity: ""
});

const trimToNull = (value: string): string | null => {
  const t = value.trim();
  return t.length > 0 ? t : null;
};

/** 空白可。不正な数値のとき NaN を返す */
export const parsePartInputNumber = (value: string): number | null => {
  const t = value.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
};

export function partItemToApiRecord(item: BlendLotPartItem): Record<string, string | number> {
  const rec: Record<string, string | number> = {};
  if (item.partLotNo?.trim()) rec.part_lot_no = item.partLotNo.trim();
  if (item.organicClass?.trim()) rec.organic_class = item.organicClass.trim();
  if (item.itemGroupNo?.trim()) rec.item_group_no = item.itemGroupNo.trim();
  if (item.useQuantity != null) rec.use_quantity = item.useQuantity;
  return rec;
}

export function buildPartItemFromInput(
  input: BlendLotPartInputForm,
  id: string
): BlendLotPartItem | "missing_required" | "invalid_number" {
  const partLotNo = trimToNull(input.partLotNo);
  const useQuantity = parsePartInputNumber(input.useQuantity);
  if (!partLotNo || useQuantity === null) return "missing_required";
  if (Number.isNaN(useQuantity)) return "invalid_number";

  return {
    id,
    partLotNo,
    organicClass: trimToNull(input.organicClass),
    itemGroupNo: trimToNull(input.itemGroupNo),
    useQuantity
  };
}

export const toDateText = (value: string | null): string => {
  if (!value) return "";
  const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = String(Number(ymdMatch[2])).padStart(2, "0");
    const dd = String(Number(ymdMatch[3])).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

export const toNumberText = (value: number | null): string => (value == null ? "" : numberFormatter.format(value));

const asStringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : value == null ? null : String(value);

export const parsePartItems = (raw: unknown): BlendLotPartItem[] => {
  if (raw == null) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const partLotNoRaw = row.part_lot_no ?? row.partLotNo;
      const useQuantityRaw = row.use_quantity ?? row.useQuantity;
      const useQuantity =
        typeof useQuantityRaw === "number" && Number.isFinite(useQuantityRaw)
          ? useQuantityRaw
          : typeof useQuantityRaw === "string" && useQuantityRaw.trim() !== ""
            ? Number(useQuantityRaw)
            : null;
      return {
        id: `${index}-${asStringOrNull(partLotNoRaw) ?? "part"}`,
        partLotNo: asStringOrNull(partLotNoRaw),
        organicClass: asStringOrNull(row.organic_class ?? row.organicClass),
        itemGroupNo: asStringOrNull(row.item_group_no ?? row.itemGroupNo),
        useQuantity: useQuantity != null && Number.isFinite(useQuantity) ? useQuantity : null
      };
    });
  } catch {
    return [];
  }
};

export const blendLotRowId = (row: TeBlendLot): string =>
  `${row.productNo ?? "product"}-${row.workDate ?? ""}-${row.itemNo ?? ""}`;
