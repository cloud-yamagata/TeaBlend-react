/**
 * ブレンドロット一覧・部品表の表示用ユーティリティ
 */
import { formatFactory2OrganicClass } from "../Factory2LotManufacture/factory2LotDisplay";
import type { TeBlendLot } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP");

/** tr_item_group 未読込時の商品分類名称（ItemCorrect と同型） */
const ITEM_GROUP_FALLBACK_LABELS: Record<string, string> = {
  "1": "商品",
  "3": "仕上茶",
  "4": "仕入茶",
  "5": "委託品",
  "6": "ブレンド",
  "7": "委託支給",
  "9": "卸"
};

type ItemGroupLookupRow = {
  data: { item_group_no: number; item_group_name: string | null };
};

/** 有機区分 … コード:名称 */
export function formatBlendLotPartOrganicClass(organicClass: string | null): string {
  if (!organicClass?.trim()) return "";
  return formatFactory2OrganicClass(organicClass);
}

/** 商品分類 … コード:名称 */
export function formatBlendLotPartItemGroupNo(
  itemGroupNo: string | null,
  itemGroups: readonly ItemGroupLookupRow[]
): string {
  const code = (itemGroupNo ?? "").trim();
  if (!code) return "";
  const n = Number(code);
  if (Number.isFinite(n)) {
    const group = itemGroups.find((row) => row.data.item_group_no === n);
    const name = group?.data.item_group_name?.trim();
    if (name) return `${code}:${name}`;
  }
  const fallback = ITEM_GROUP_FALLBACK_LABELS[code] ?? ITEM_GROUP_FALLBACK_LABELS[String(Number(code))];
  if (fallback) return `${code}:${fallback}`;
  return code;
}

/** lot_part_info 配列の1要素（仕上茶在庫 ZOOM 選択ベース） */
export type BlendLotPartItem = {
  id: string;
  itemNo: number | null;
  organicClass: string | null;
  itemGroupNo: string | null;
  itemName: string | null;
  /** 製造No（API では part_lot_no にも載せる） */
  productNo: number | null;
  stocQuantity: number | null;
  useQuantity: number | null;
};

/** 登録モーダル … 部品1行分の入力（ZOOM セット＋使用数量） */
export type BlendLotPartInputForm = {
  itemNo: string;
  organicClass: string;
  itemGroupNo: string;
  itemName: string;
  productNo: string;
  stocQuantity: string;
  useQuantity: string;
};

export const emptyPartInput = (): BlendLotPartInputForm => ({
  itemNo: "",
  organicClass: "",
  itemGroupNo: "",
  itemName: "",
  productNo: "",
  stocQuantity: "",
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

const asStringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : value == null ? null : String(value);

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export function partItemToApiRecord(item: BlendLotPartItem): Record<string, string | number> {
  const rec: Record<string, string | number> = {};
  if (item.itemNo != null) rec.item_no = item.itemNo;
  if (item.organicClass?.trim()) rec.organic_class = item.organicClass.trim();
  if (item.itemGroupNo?.trim()) rec.item_group_no = item.itemGroupNo.trim();
  if (item.itemName?.trim()) rec.item_name = item.itemName.trim();
  if (item.productNo != null) {
    rec.product_no = item.productNo;
    rec.part_lot_no = String(item.productNo);
  }
  if (item.stocQuantity != null) rec.stoc_quantity = item.stocQuantity;
  if (item.useQuantity != null) rec.use_quantity = item.useQuantity;
  return rec;
}

export function buildPartItemFromInput(
  input: BlendLotPartInputForm,
  id: string
): BlendLotPartItem | "missing_required" | "invalid_number" {
  const productNo = parsePartInputNumber(input.productNo);
  const useQuantity = parsePartInputNumber(input.useQuantity);
  if (productNo === null || useQuantity === null || trimToNull(input.itemNo) == null) {
    return "missing_required";
  }
  if (Number.isNaN(productNo) || Number.isNaN(useQuantity)) return "invalid_number";

  const itemNo = parsePartInputNumber(input.itemNo);
  if (itemNo === null || Number.isNaN(itemNo)) return "invalid_number";

  const stocQuantity = parsePartInputNumber(input.stocQuantity);

  return {
    id,
    itemNo,
    organicClass: trimToNull(input.organicClass),
    itemGroupNo: trimToNull(input.itemGroupNo),
    itemName: trimToNull(input.itemName),
    productNo,
    stocQuantity: stocQuantity != null && !Number.isNaN(stocQuantity) ? stocQuantity : null,
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

export const parsePartItems = (raw: unknown): BlendLotPartItem[] => {
  if (raw == null) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const productNo =
        asNumberOrNull(row.product_no ?? row.productNo) ??
        asNumberOrNull(row.part_lot_no ?? row.partLotNo);
      return {
        id: `${index}-${productNo ?? asStringOrNull(row.part_lot_no ?? row.partLotNo) ?? "part"}`,
        itemNo: asNumberOrNull(row.item_no ?? row.itemNo),
        organicClass: asStringOrNull(row.organic_class ?? row.organicClass),
        itemGroupNo: asStringOrNull(row.item_group_no ?? row.itemGroupNo),
        itemName: asStringOrNull(row.item_name ?? row.itemName),
        productNo,
        stocQuantity: asNumberOrNull(row.stoc_quantity ?? row.stocQuantity),
        useQuantity: asNumberOrNull(row.use_quantity ?? row.useQuantity)
      };
    });
  } catch {
    return [];
  }
};

export const blendLotRowId = (row: TeBlendLot): string =>
  `${row.productNo ?? "product"}-${row.workDate ?? ""}-${row.itemNo ?? ""}`;
