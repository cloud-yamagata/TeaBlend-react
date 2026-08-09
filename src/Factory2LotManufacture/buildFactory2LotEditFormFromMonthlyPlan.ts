/**
 * 月次計画（te_monthly_plan）から第2工場ロット新規登録モーダル初期値を組み立てる。
 *
 * - 工程・通称名は1段目を正（計画は警告・検証のみ）
 * - lot_part_info は在庫照合付きで使用部品一覧へ展開
 */
import type { ViFactory2Stock } from "../domain/masterTableEntityModels";
import type { TeMonthlyPlan, TrItem } from "../MonthlyPlan/types";
import { parsePartItems } from "../MonthlyPlan/monthlyPlanDisplayUtils";
import { formatFactory2ProcessType, normalizeProcessTypeCode } from "./factory2LotDisplay";
import { normalizeMakeYearFromForm } from "./factory2MakeYear";
import type { Factory2LotEditFormData } from "./factory2LotEditTypes";
import type { Factory2ProcessFilter } from "./types";
import { monthlyPlanPartsToFactory2EditParts } from "./monthlyPlanPartsToFactory2EditParts";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const formatNum = (n: number | null | undefined, fractionDigits?: number): string => {
  if (n == null || !Number.isFinite(n)) return "";
  if (fractionDigits != null) return n.toFixed(fractionDigits);
  return numberFormatter.format(n);
};

const toDateInputValue = (workDate: string | null): string => {
  if (!workDate) return "";
  const m = workDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const parseWorkTimeToHhMm = (workTime: string | null): { hh: string; mm: string } => {
  if (!workTime) return { hh: "", mm: "" };
  const m = workTime.match(/^(\d{1,2}):(\d{1,2})/);
  if (!m) return { hh: "", mm: "" };
  return {
    hh: String(Number(m[1])).padStart(2, "0"),
    mm: String(Number(m[2])).padStart(2, "0")
  };
};

const makeYearFromPlanYear = (year: number | null): string => {
  if (year == null || !Number.isFinite(year)) return "";
  const y = year >= 100 ? year % 100 : year;
  return normalizeMakeYearFromForm(String(y));
};

const sumInputQuantity = (rows: Factory2LotEditFormData["partRows"]): string => {
  let total = 0;
  for (const row of rows) {
    const n = Number(row.useQuantity.replace(/,/g, ""));
    if (Number.isFinite(n)) total += n;
  }
  return total > 0 ? formatNum(total, 2) : "";
};

export function findMonthlyPlanByPlanNo(
  plans: TeMonthlyPlan[],
  planNoText: string
): TeMonthlyPlan | null {
  const n = Number(planNoText.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return plans.find((p) => p.planNo === n) ?? null;
};

export type BuildFromMonthlyPlanOptions = {
  menuProcess: Factory2ProcessFilter;
  registItemName: string;
  registItemNo: string;
  stocks: ViFactory2Stock[];
  trItems: TrItem[];
};

export function buildFactory2LotEditFormFromMonthlyPlan(
  baseForm: Factory2LotEditFormData,
  plan: TeMonthlyPlan,
  options: BuildFromMonthlyPlanOptions
): { form: Factory2LotEditFormData; warnings: string[] } {
  const warnings: string[] = [];
  const planProcess = normalizeProcessTypeCode(plan.processType ?? "");
  const menuProcess = normalizeProcessTypeCode(options.menuProcess);

  if (planProcess && menuProcess && planProcess !== menuProcess) {
    warnings.push(
      `計画の工程（${formatFactory2ProcessType(planProcess)}）と1段目の工程（${formatFactory2ProcessType(menuProcess)}）が異なります。1段目の工程を使用します。`
    );
  }

  const registItemNo = Number(options.registItemNo.trim());
  if (plan.itemNo != null && Number.isFinite(registItemNo) && registItemNo > 0 && plan.itemNo !== registItemNo) {
    warnings.push(
      "計画の商品コードと仕上茶ZOOMの商品コードが異なります。通称名は画面指定を使用します。"
    );
  }

  const planItem = plan.itemNo != null ? options.trItems.find((i) => i.itemNo === plan.itemNo) : undefined;
  const planItemName = planItem?.itemName?.trim() ?? "";
  const screenItemName = options.registItemName.trim();
  if (planItemName && screenItemName && planItemName !== screenItemName) {
    warnings.push(
      `計画の通称名（${planItemName}）と画面の通称名が異なります。画面の通称名を使用します。`
    );
  }

  const partItems = parsePartItems(plan.lotPartInfo);
  const { rows: partRows, warnings: partWarnings } = monthlyPlanPartsToFactory2EditParts(
    partItems,
    options.stocks
  );
  warnings.push(...partWarnings);

  const planMakeYear = makeYearFromPlanYear(plan.year);
  const workStart = parseWorkTimeToHhMm(plan.workTime);

  const form: Factory2LotEditFormData = {
    ...baseForm,
    itemName: screenItemName || baseForm.itemName,
    makeYear: planMakeYear || baseForm.makeYear,
    workDate: toDateInputValue(plan.workDate) || baseForm.workDate,
    lotName: (plan.lotName ?? "").trim() || baseForm.lotName,
    unitWeight: plan.unitWeight != null ? formatNum(plan.unitWeight) : baseForm.unitWeight,
    summaryRemarks: (plan.remarks ?? "").trim() || baseForm.summaryRemarks,
    workStart,
    partRows,
    inputQuantity: sumInputQuantity(partRows) || baseForm.inputQuantity,
    planContext: {
      planNo: plan.planNo ?? 0,
      year: plan.year,
      month: plan.month
    }
  };

  return { form, warnings };
}
