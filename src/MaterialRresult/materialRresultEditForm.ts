/**
 * 原料実績 編集フォーム（EditWindow.xaml 相当）
 */
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import type {
  MaterialResultDeleteBody,
  MaterialResultUpsertBody
} from "../repositories/materialResultRepository";
import { normalizeDateToYmd } from "../lib/searchNormalize";
import type { MaterialRresultRow } from "./types";

export const TEA_RANK_OPTIONS = [
  "棒",
  "ケバ",
  "頭",
  "頭茶",
  "木茎",
  "浮葉",
  "粉茶",
  "ﾆﾉﾛ",
  "本茶"
] as const;

export const TEA_TYPE_OPTIONS = [
  "出物",
  "煎茶",
  "深蒸茶",
  "釜炒茶",
  "蒸ぐり茶",
  "番茶",
  "紅茶"
] as const;

export const TEA_LIFE_OPTIONS = ["1茶", "2茶", "3茶", "4茶", "番茶", "秋番茶"] as const;

export const ORGANIC_CLASS_OPTIONS = [
  { value: "A", label: "A（有機茶）" },
  { value: "B", label: "B（無農薬）" },
  { value: "C", label: "C（一般茶）" }
] as const;

export type MaterialRresultEditForm = {
  year: string;
  purchase: string;
  productNo: string;
  purchaseDate: string;
  teaRank: string;
  rank: string;
  teaType: string;
  teaLife: string;
  organicClass: string;
  producer: string;
  materialName: string;
  unitWeight: string;
  unitNumber: string;
  fractionWeight: string;
  fractionNumber: string;
  remarks: string;
  /** 変更時の複合キー（PK変更不可） */
  initialKey: MaterialResultDeleteBody | null;
};

export type MaterialRresultEditFieldErrors = Partial<Record<keyof MaterialRresultEditForm, string>>;

const todayYmd = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function createEmptyMaterialRresultEditForm(initialYear?: string): MaterialRresultEditForm {
  return {
    year: initialYear?.trim() ? normalizeMakeYearFromForm(initialYear) : getDefaultMakeYear(),
    purchase: "",
    productNo: "",
    purchaseDate: todayYmd(),
    teaRank: "",
    rank: "",
    teaType: "",
    teaLife: "",
    organicClass: "A",
    producer: "",
    materialName: "",
    unitWeight: "0",
    unitNumber: "0",
    fractionWeight: "0",
    fractionNumber: "0",
    remarks: "",
    initialKey: null
  };
}

export function createMaterialRresultEditFormFromRow(row: MaterialRresultRow): MaterialRresultEditForm {
  const year =
    row.year != null
      ? String(row.year >= 100 ? row.year % 100 : row.year).padStart(2, "0")
      : getDefaultMakeYear();
  const qty = (n: number | null) =>
    n != null && Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : "0";
  const intStr = (n: number | null) => (n != null && Number.isFinite(n) ? String(Math.trunc(n)) : "0");
  const purchaseDate = normalizeDateToYmd(row.purchaseDate) ?? todayYmd();
  const yearNum = Number(normalizeMakeYearFromForm(year));
  return {
    year,
    purchase: row.purchase,
    productNo: row.productNo,
    purchaseDate,
    teaRank: row.teaRank,
    rank: row.rank,
    teaType: row.teaType,
    teaLife: row.teaLife,
    organicClass: row.organicClass || "A",
    producer: row.producer,
    materialName: row.materialName,
    unitWeight: qty(row.unitWeight),
    unitNumber: intStr(row.unitNumber),
    fractionWeight: qty(row.fractionWeight),
    fractionNumber: intStr(row.fractionNumber),
    remarks: row.remarks,
    initialKey: {
      year: yearNum,
      purchase: row.purchase,
      product_no: row.productNo,
      purchase_date: purchaseDate,
      tea_rank: row.teaRank,
      rank: row.rank
    }
  };
}

/** 選択行 COPY 登録（製造NO・原料名は初期化） */
export function createMaterialRresultEditFormFromCopy(
  row: MaterialRresultRow,
  initialYear?: string
): MaterialRresultEditForm {
  const base = createEmptyMaterialRresultEditForm(initialYear);
  return {
    ...base,
    purchase: row.purchase,
    teaRank: row.teaRank,
    rank: row.rank,
    teaType: row.teaType,
    teaLife: row.teaLife,
    organicClass: row.organicClass || "A",
    producer: row.producer,
    unitWeight:
      row.unitWeight != null ? (Math.round(row.unitWeight * 100) / 100).toFixed(2) : "0",
    unitNumber: row.unitNumber != null ? String(Math.trunc(row.unitNumber)) : "0",
    fractionWeight:
      row.fractionWeight != null ? (Math.round(row.fractionWeight * 100) / 100).toFixed(2) : "0",
    fractionNumber: row.fractionNumber != null ? String(Math.trunc(row.fractionNumber)) : "0",
    remarks: row.remarks
  };
}

/** WPF EditWindowViewModel.GetMaterialName */
export function buildMaterialRresultMaterialName(
  form: Pick<
    MaterialRresultEditForm,
    "purchase" | "organicClass" | "teaType" | "teaRank" | "rank" | "productNo" | "year" | "producer" | "teaLife"
  >
): string {
  const purchase = form.purchase.trim();
  const organic = form.organicClass.trim().toUpperCase();
  let prefix = "";
  if (organic === "A") prefix = "有機";
  else if (organic === "B") prefix = "無農薬";

  if (purchase === "第2工場") {
    return `${prefix}仕上${form.teaType.trim()}${form.teaRank.trim()}${form.rank.trim()} 仕-${form.productNo.trim()}`;
  }
  if (purchase === "児湯茶") {
    return `(${form.year.trim()})${prefix}${form.producer.trim()}${form.teaLife.trim()}${form.rank.trim()}-${form.productNo.trim()}`;
  }
  return "";
}

export function sanitizeDecimal2Input(raw: string): string {
  const t = raw.replace(/[^\d.]/g, "");
  const parts = t.split(".");
  if (parts.length === 1) return parts[0] ?? "";
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function formatDecimal2OnBlur(raw: string): string {
  const n = Number(raw.trim());
  if (!Number.isFinite(n)) return raw.trim() === "" ? "" : raw;
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function validateMaterialRresultEditForm(form: MaterialRresultEditForm): MaterialRresultEditFieldErrors {
  const errors: MaterialRresultEditFieldErrors = {};
  if (!normalizeMakeYearFromForm(form.year)) errors.year = "年度を入力してください";
  if (!form.purchase.trim()) errors.purchase = "仕入先を入力してください";
  if (!form.productNo.trim()) errors.productNo = "製造NOを入力してください";
  if (!form.purchaseDate.trim()) errors.purchaseDate = "仕入日を入力してください";
  if (!form.teaRank.trim()) errors.teaRank = "品柄を選択してください";
  if (!form.rank.trim()) errors.rank = "等級を入力してください";
  if (!form.materialName.trim()) errors.materialName = "原料名を入力してください";
  if (!form.organicClass.trim()) errors.organicClass = "格付を選択してください";

  const unitWeight = Number(form.unitWeight);
  const unitNumber = Number(form.unitNumber);
  const fractionWeight = Number(form.fractionWeight);
  const fractionNumber = Number(form.fractionNumber);
  if (!Number.isFinite(unitWeight)) errors.unitWeight = "数値を入力してください";
  if (!Number.isFinite(unitNumber)) errors.unitNumber = "数値を入力してください";
  if (!Number.isFinite(fractionWeight)) errors.fractionWeight = "数値を入力してください";
  if (!Number.isFinite(fractionNumber)) errors.fractionNumber = "数値を入力してください";

  return errors;
}

export function materialRresultIsMandatoryEmpty(
  key: "year" | "purchase" | "productNo" | "purchaseDate" | "teaRank" | "rank" | "materialName" | "organicClass",
  form: MaterialRresultEditForm
): boolean {
  switch (key) {
    case "year":
      return !normalizeMakeYearFromForm(form.year);
    case "purchase":
      return !form.purchase.trim();
    case "productNo":
      return !form.productNo.trim();
    case "purchaseDate":
      return !form.purchaseDate.trim();
    case "teaRank":
      return !form.teaRank.trim();
    case "rank":
      return !form.rank.trim();
    case "materialName":
      return !form.materialName.trim();
    case "organicClass":
      return !form.organicClass.trim();
  }
}

export function materialRresultEditFormToUpsertBody(form: MaterialRresultEditForm): MaterialResultUpsertBody {
  const year = Number(normalizeMakeYearFromForm(form.year));
  return {
    year,
    purchase: form.purchase.trim(),
    product_no: form.productNo.trim(),
    purchase_date: form.purchaseDate.trim(),
    tea_rank: form.teaRank.trim(),
    rank: form.rank.trim(),
    tea_type: form.teaType.trim() || null,
    tea_life: form.teaLife.trim() || null,
    organic_class: form.organicClass.trim().toUpperCase() || "A",
    producer: form.producer.trim() || null,
    material_name: form.materialName.trim(),
    unit_weight: Number(form.unitWeight) || 0,
    unit_number: Math.trunc(Number(form.unitNumber) || 0),
    fraction_weight: Number(form.fractionWeight) || 0,
    fraction_number: Math.trunc(Number(form.fractionNumber) || 0),
    remarks: form.remarks.trim() || null
  };
}

export function materialRresultEditFormToDeleteBody(form: MaterialRresultEditForm): MaterialResultDeleteBody {
  if (form.initialKey) return form.initialKey;
  const body = materialRresultEditFormToUpsertBody(form);
  return {
    year: body.year,
    purchase: body.purchase,
    product_no: body.product_no,
    purchase_date: body.purchase_date,
    tea_rank: body.tea_rank,
    rank: body.rank
  };
}
