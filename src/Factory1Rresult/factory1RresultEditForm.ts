/**
 * 第1工場生産実績 編集フォーム（EditWindow.xaml 相当）
 */
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import type { Factory1ResultUpsertBody } from "../repositories/factory1ResultRepository";
import type { Factory1RresultRow } from "./types";

export const TEA_RANK_OPTIONS = ["本茶", "頭茶", "木茎", "浮葉", "粉茶", "ﾆﾉﾛ"] as const;
export const TEA_LIFE_OPTIONS = ["1茶", "2茶", "3茶", "4茶", "番茶", "秋番茶"] as const;
export const GRADE_OPTIONS = ["一般", "有機", "無農薬"] as const;

export type Factory1RresultEditForm = {
  lotNo: string;
  /** 登録開始時のロットNO（構成未変更チェック用） */
  initialLotNo: string;
  workDate: string;
  year: string;
  variety: string;
  teaRank: string;
  fieldNo: string;
  teaLife: string;
  isTeaLifeCheck: boolean;
  grade: string;
  isGradeCheck: boolean;
  unitWeight: string;
  unitNumber: string;
  fractionWeight: string;
  fractionNumber: string;
  target: string;
  isTargetCheck: boolean;
  remarks: string;
};

export type Factory1RresultEditFieldErrors = Partial<Record<keyof Factory1RresultEditForm, string>>;

const todayYmd = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const workDatePrefix = (workDate: string): string => {
  const m = workDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[1].slice(-2)}${m[2]}${m[3]}.`;
};

/** WPF StoreMaster.GetShortVariety */
export function getShortVariety(variety: string): string {
  switch (variety.trim()) {
    case "ﾕﾀｶﾐﾄﾞﾘ":
      return "ﾕﾀｶ";
    case "ﾔﾌﾞｷﾀ":
      return "ﾔﾌﾞ";
    case "ｱｻﾂﾕ":
      return "ｱｻ";
    case "ｸﾘﾀﾜｾ":
      return "ｸﾘﾀ";
    case "ﾍﾞﾆﾌｳｷ":
      return "ﾍﾞﾆ";
    case "ﾐﾅﾐｻﾔｶ":
      return "ﾐﾅﾐ";
    default:
      return "";
  }
}

/** WPF GetLotNo: yyMMdd. + field_no + 品種略 + 品柄先頭1文字 */
export function buildFactory1LotNo(form: Pick<Factory1RresultEditForm, "workDate" | "fieldNo" | "variety" | "teaRank">): string {
  const prefix = workDatePrefix(form.workDate);
  const rank = form.teaRank.trim();
  const rankHead = rank.length > 0 ? rank.slice(0, 1) : "";
  return `${prefix}${form.fieldNo.trim()}${getShortVariety(form.variety)}${rankHead}`;
}

/**
 * WPF EditWindowViewModel.GetLotNo 相当（ロットNOボタン）
 * 品柄未選択時は C# Substring(0,1) 例外相当としてエラーを返す
 */
export function applyFactory1LotNoButton(
  form: Factory1RresultEditForm
): { ok: true; lotNo: string } | { ok: false; message: string } {
  if (!form.workDate.trim()) {
    return { ok: false, message: "生産日を入力してください" };
  }
  if (!form.teaRank.trim()) {
    return { ok: false, message: "品柄を選択してください" };
  }
  return { ok: true, lotNo: buildFactory1LotNo(form) };
}

export function createEmptyFactory1RresultEditForm(initialYear?: string): Factory1RresultEditForm {
  const workDate = todayYmd();
  return {
    lotNo: "",
    initialLotNo: "",
    workDate,
    year: initialYear?.trim() ? normalizeMakeYearFromForm(initialYear) : getDefaultMakeYear(),
    variety: "",
    teaRank: "",
    fieldNo: "",
    teaLife: "",
    isTeaLifeCheck: false,
    grade: "",
    isGradeCheck: false,
    unitWeight: "0",
    unitNumber: "0",
    fractionWeight: "0",
    fractionNumber: "0",
    target: "",
    isTargetCheck: false,
    remarks: ""
  };
}

export function createFactory1RresultEditFormFromRow(row: Factory1RresultRow): Factory1RresultEditForm {
  const year =
    row.year != null
      ? String(row.year >= 100 ? row.year % 100 : row.year).padStart(2, "0")
      : getDefaultMakeYear();
  const qty = (n: number | null) =>
    n != null && Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : "0";
  const intStr = (n: number | null) => (n != null && Number.isFinite(n) ? String(Math.trunc(n)) : "0");
  return {
    lotNo: row.lotNo,
    initialLotNo: row.lotNo,
    workDate: row.workDate ?? todayYmd(),
    year,
    variety: row.variety,
    teaRank: row.teaRank,
    fieldNo: row.fieldNo,
    teaLife: row.teaLife,
    isTeaLifeCheck: false,
    grade: row.grade || "有機",
    isGradeCheck: false,
    unitWeight: qty(row.unitWeight),
    unitNumber: intStr(row.unitNumber),
    fractionWeight: qty(row.fractionWeight),
    fractionNumber: intStr(row.fractionNumber),
    target: row.target,
    isTargetCheck: false,
    remarks: row.remarks
  };
}

/** 選択行 COPY 登録（ロット・生産日は初期化） */
export function createFactory1RresultEditFormFromCopy(
  row: Factory1RresultRow,
  initialYear?: string
): Factory1RresultEditForm {
  const base = createEmptyFactory1RresultEditForm(initialYear);
  return {
    ...base,
    variety: row.variety,
    teaRank: row.teaRank,
    fieldNo: row.fieldNo,
    teaLife: row.teaLife,
    grade: row.grade || "有機",
    unitWeight:
      row.unitWeight != null ? (Math.round(row.unitWeight * 100) / 100).toFixed(2) : "0",
    unitNumber: row.unitNumber != null ? String(Math.trunc(row.unitNumber)) : "0",
    fractionWeight:
      row.fractionWeight != null ? (Math.round(row.fractionWeight * 100) / 100).toFixed(2) : "0",
    fractionNumber: row.fractionNumber != null ? String(Math.trunc(row.fractionNumber)) : "0",
    target: row.target,
    remarks: row.remarks
  };
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

export function validateFactory1RresultEditForm(form: Factory1RresultEditForm): Factory1RresultEditFieldErrors {
  const errors: Factory1RresultEditFieldErrors = {};
  /** 赤枠対象: ロットNO〜格付（圃場を除く） */
  if (!form.lotNo.trim()) errors.lotNo = "ロットNOを入力してください";
  if (!form.workDate.trim()) errors.workDate = "生産日を入力してください";
  if (!normalizeMakeYearFromForm(form.year)) errors.year = "年度を入力してください";
  if (!form.variety.trim()) errors.variety = "品種を入力してください";
  if (!form.teaRank.trim()) errors.teaRank = "品柄を選択してください";
  if (!form.teaLife.trim()) errors.teaLife = "茶期を選択してください";
  if (!form.grade.trim()) errors.grade = "格付を選択してください";
  /** 圃場は登録に必要だが赤枠対象外 */
  if (!form.fieldNo.trim()) errors.fieldNo = "圃場を入力してください";

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

/** 未入力時に赤枠を出す項目（ロットNO〜格付。圃場は除く）… 初期表示から常時判定 */
export function factory1RresultIsMandatoryEmpty(
  key: "lotNo" | "workDate" | "year" | "variety" | "teaRank" | "teaLife" | "grade",
  form: Factory1RresultEditForm
): boolean {
  switch (key) {
    case "lotNo":
      return !form.lotNo.trim();
    case "workDate":
      return !form.workDate.trim();
    case "year":
      return !normalizeMakeYearFromForm(form.year);
    case "variety":
      return !form.variety.trim();
    case "teaRank":
      return !form.teaRank.trim();
    case "teaLife":
      return !form.teaLife.trim();
    case "grade":
      return !form.grade.trim();
  }
}

export function factory1RresultEditFormToUpsertBody(form: Factory1RresultEditForm): Factory1ResultUpsertBody {
  const year = Number(normalizeMakeYearFromForm(form.year));
  return {
    lot_no: form.lotNo.trim(),
    year,
    work_date: form.workDate.trim(),
    variety: form.variety.trim(),
    tea_life: form.teaLife.trim(),
    grade: form.grade.trim(),
    tea_rank: form.teaRank.trim(),
    field_no: form.fieldNo.trim(),
    unit_weight: Number(form.unitWeight) || 0,
    unit_number: Math.trunc(Number(form.unitNumber) || 0),
    fraction_weight: Number(form.fractionWeight) || 0,
    fraction_number: Math.trunc(Number(form.fractionNumber) || 0),
    target: form.target.trim() || null,
    remarks: form.remarks.trim() || null
  };
}
