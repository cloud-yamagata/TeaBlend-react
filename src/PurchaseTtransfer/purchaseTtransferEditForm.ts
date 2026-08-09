/**
 * 仕入実績情報メンテナンス（EditWindow.xaml 左ペイン）フォーム
 */
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import type { PurchaseTtransferRow } from "./types";

export const TEA_LIFE_OPTIONS = ["1茶", "2茶", "3茶", "4茶", "番茶", "秋番茶"] as const;
export const GRADE_OPTIONS = ["一般", "有機", "無農薬"] as const;
export const TEA_TYPE_OPTIONS = ["煎茶", "深蒸茶", "釜炒茶", "蒸ぐり茶", "番茶", "紅茶"] as const;
export const TEA_RANK_OPTIONS = ["本茶", "頭茶", "木茎", "浮葉", "粉茶", "ﾆﾉﾛ"] as const;

export type PurchaseTtransferEditForm = {
  year: string;
  purchase: string;
  bidNo: string;
  purchaseDate: string;
  variety: string;
  isVarietyCheck: boolean;
  teaLife: string;
  isTeaLifeCheck: boolean;
  grade: string;
  isGradeCheck: boolean;
  teaType: string;
  isTeaTypeCheck: boolean;
  teaRank: string;
  isTeaRankCheck: boolean;
  fieldNo: string;
  isFieldNoCheck: boolean;
  producer: string;
  cost: string;
  unitWeight: string;
  unitNumber: string;
  fractionWeight: string;
  fractionNumber: string;
  discount: string;
  target: string;
  isTargetCheck: boolean;
  targetPlan: string;
  isTargetPlanCheck: boolean;
  lotNo: string;
  remarks: string;
};

export type PurchaseTtransferEditFieldErrors = Partial<
  Record<"year" | "purchase" | "bidNo" | "purchaseDate" | "cost" | "unitWeight" | "unitNumber" | "fractionWeight" | "fractionNumber" | "discount", string>
>;

const todayIsoDate = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function createEmptyPurchaseTtransferEditForm(initialYear?: string): PurchaseTtransferEditForm {
  return {
    year: initialYear?.trim() ? normalizeMakeYearFromForm(initialYear) : getDefaultMakeYear(),
    purchase: "",
    bidNo: "",
    purchaseDate: todayIsoDate(),
    variety: "",
    isVarietyCheck: false,
    teaLife: "1茶",
    isTeaLifeCheck: false,
    grade: "一般",
    isGradeCheck: false,
    teaType: "煎茶",
    isTeaTypeCheck: false,
    teaRank: "本茶",
    isTeaRankCheck: false,
    fieldNo: "",
    isFieldNoCheck: false,
    producer: "",
    cost: "0",
    unitWeight: "0.00",
    unitNumber: "0",
    fractionWeight: "0.00",
    fractionNumber: "0",
    discount: "0",
    target: "",
    isTargetCheck: false,
    targetPlan: "",
    isTargetPlanCheck: false,
    lotNo: "",
    remarks: ""
  };
}

/** 一括変更モーダル用（全項目初期状態・チェックボックスは未チェック） */
export function createBulkUpdatePurchaseTtransferEditForm(): PurchaseTtransferEditForm {
  return createEmptyPurchaseTtransferEditForm();
}

export function hasBulkUpdateFieldChecked(form: PurchaseTtransferEditForm): boolean {
  return (
    form.isVarietyCheck ||
    form.isTeaLifeCheck ||
    form.isGradeCheck ||
    form.isTeaTypeCheck ||
    form.isTeaRankCheck ||
    form.isFieldNoCheck ||
    form.isTargetCheck ||
    form.isTargetPlanCheck
  );
}

const toIntText = (value: number | null): string => (value == null ? "0" : String(value));

const toDecimal2Text = (value: number | null): string =>
  value == null ? "0.00" : (Math.round(value * 100) / 100).toFixed(2);

/** 一覧選択行を COPY ベースにした登録フォーム（年度・入札NO・仕入日は初期化） */
export function createPurchaseTtransferEditFormFromRow(row: PurchaseTtransferRow): PurchaseTtransferEditForm {
  const base = createEmptyPurchaseTtransferEditForm();
  return {
    ...base,
    year: getDefaultMakeYear(),
    bidNo: "",
    purchaseDate: todayIsoDate(),
    purchase: row.purchase,
    variety: row.variety,
    teaLife: row.teaLife || base.teaLife,
    grade: row.grade || base.grade,
    teaType: row.teaType || base.teaType,
    teaRank: row.teaRank || base.teaRank,
    fieldNo: row.fieldNo,
    producer: row.producer,
    cost: toIntText(row.cost),
    unitWeight: toDecimal2Text(row.unitWeight),
    unitNumber: toIntText(row.unitNumber),
    fractionWeight: toDecimal2Text(row.fractionWeight),
    fractionNumber: toIntText(row.fractionNumber),
    discount: toIntText(row.discount),
    target: row.target,
    targetPlan: row.targetPlan,
    lotNo: row.lotNo
  };
}

const parseIntField = (label: string, text: string, errors: PurchaseTtransferEditFieldErrors, key: keyof PurchaseTtransferEditFieldErrors): number => {
  const t = text.trim().replace(/,/g, "");
  if (!t) {
    errors[key] = `${label}を入力してください`;
    return 0;
  }
  if (!/^\d+$/.test(t)) {
    errors[key] = `${label}は整数で入力してください`;
    return 0;
  }
  const n = Number(t);
  if (!Number.isFinite(n)) {
    errors[key] = `${label}は整数で入力してください`;
    return 0;
  }
  return n;
};

const parseDecimal2Field = (
  label: string,
  text: string,
  errors: PurchaseTtransferEditFieldErrors,
  key: keyof PurchaseTtransferEditFieldErrors
): number => {
  const t = text.trim().replace(/,/g, "");
  if (!t) {
    errors[key] = `${label}を入力してください`;
    return 0;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    errors[key] = `${label}は小数2桁以内で入力してください`;
    return 0;
  }
  const n = Number(t);
  if (!Number.isFinite(n)) {
    errors[key] = `${label}は数値で入力してください`;
    return 0;
  }
  return Math.round(n * 100) / 100;
};

/** 整数入力用（梱包数・端数数） */
export function sanitizePurchaseIntegerInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** 小数2桁入力用（梱包重量・端数重量） */
export function sanitizePurchaseDecimal2Input(raw: string): string {
  const normalized = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = normalized.indexOf(".");
  if (dotIndex === -1) return normalized;
  const intPart = normalized.slice(0, dotIndex);
  const fracPart = normalized.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
  return `${intPart}.${fracPart}`;
}

/** blur 時に小数2桁表示へ整形 */
export function formatPurchaseDecimal2OnBlur(text: string): string {
  const t = text.trim().replace(/,/g, "");
  if (!t || t === ".") return "0.00";
  const n = Number(t);
  if (!Number.isFinite(n)) return "0.00";
  return (Math.round(n * 100) / 100).toFixed(2);
}

const DISCOUNT_MIN = 0;
const DISCOUNT_MAX = 99;

/** 粉引(%) 入力用（整数・最大2桁） */
export function sanitizePurchaseDiscountInput(raw: string): string {
  return raw.replace(/[^\d]/g, "").slice(0, 2);
}

/** blur 時に 0～99 へ整形 */
export function formatPurchaseDiscountOnBlur(text: string): string {
  const t = text.trim();
  if (!t) return String(DISCOUNT_MIN);
  const n = Number(t);
  if (!Number.isFinite(n)) return String(DISCOUNT_MIN);
  return String(Math.min(DISCOUNT_MAX, Math.max(DISCOUNT_MIN, Math.floor(n))));
}

const parseDiscountField = (
  label: string,
  text: string,
  errors: PurchaseTtransferEditFieldErrors,
  key: keyof PurchaseTtransferEditFieldErrors
): number => {
  const t = text.trim();
  if (!t) {
    errors[key] = `${label}を入力してください`;
    return DISCOUNT_MIN;
  }
  if (!/^\d+$/.test(t)) {
    errors[key] = `${label}は整数で入力してください`;
    return DISCOUNT_MIN;
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < DISCOUNT_MIN || n > DISCOUNT_MAX) {
    errors[key] = `${label}は0～99の整数で入力してください`;
    return DISCOUNT_MIN;
  }
  return n;
};

export function validatePurchaseTtransferEditForm(form: PurchaseTtransferEditForm): PurchaseTtransferEditFieldErrors {
  const errors: PurchaseTtransferEditFieldErrors = {};
  const year = normalizeMakeYearFromForm(form.year);
  if (!year) errors.year = "年度を入力してください";
  if (!form.purchase.trim()) errors.purchase = "仕入先を入力してください";
  if (!form.bidNo.trim()) errors.bidNo = "入札NOを入力してください";
  if (!form.purchaseDate.trim()) errors.purchaseDate = "仕入日を入力してください";

  parseIntField("仕入単価", form.cost, errors, "cost");
  parseDecimal2Field("梱包重量", form.unitWeight, errors, "unitWeight");
  parseIntField("梱包数", form.unitNumber, errors, "unitNumber");
  parseDecimal2Field("端数重量", form.fractionWeight, errors, "fractionWeight");
  parseIntField("端数数", form.fractionNumber, errors, "fractionNumber");
  parseDiscountField("粉引", form.discount, errors, "discount");

  return errors;
}

export function purchaseTtransferEditFormToUpsertBody(form: PurchaseTtransferEditForm): Record<string, unknown> {
  const year = Number(normalizeMakeYearFromForm(form.year));
  return {
    year,
    purchase: form.purchase.trim(),
    bid_no: form.bidNo.trim(),
    purchase_date: form.purchaseDate,
    variety: form.variety.trim() || null,
    tea_life: form.teaLife.trim() || null,
    grade: form.grade.trim() || null,
    tea_type: form.teaType.trim() || null,
    tea_rank: form.teaRank.trim() || null,
    field_no: form.fieldNo.trim() || null,
    producer: form.producer.trim() || null,
    cost: parseIntField("仕入単価", form.cost, {}, "cost"),
    unit_weight: parseDecimal2Field("梱包重量", form.unitWeight, {}, "unitWeight"),
    unit_number: parseIntField("梱包数", form.unitNumber, {}, "unitNumber"),
    fraction_weight: parseDecimal2Field("端数重量", form.fractionWeight, {}, "fractionWeight"),
    fraction_number: parseIntField("端数数", form.fractionNumber, {}, "fractionNumber"),
    discount: parseDiscountField("粉引", form.discount, {}, "discount"),
    target: form.target.trim() || null,
    target_plan: form.targetPlan.trim() || null,
    lot_no: form.lotNo.trim() || null,
    remarks: form.remarks.trim() || null
  };
}
