/**
 * 【処理概要】
 *   月次製造計画の一覧・登録・更新・削除 UI。グリッド選択、編集モーダル、部品明細 JSON 等を内包する大型コンポーネント。
 *
 * 【パラメータ仕様】
 *   ルートprops無し。`MonthlyPlan/store.ts` の atom と `monthlyPlanRepository` を経由して API と通信。
 *
 * 【メンテナンス】
 *   変更時は編集フォームのバリデーション、`parsePartItems`、API payload 生成部をセットで追うこと。
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { masterDataLoadingAtom, monthlyPlanMasterErrorAtom } from "../repository/masterData";
import { MonthlyPlanListMantineTable } from "./MonthlyPlanListMantineTable";
import { MonthlyPlanPartMantineTable } from "./MonthlyPlanPartMantineTable";
import {
  buildPartItemFromInput,
  emptyMonthlyPlanPartInput,
  monthlyPlanRowId,
  parsePartItems,
  partItemToApiRecord,
  toNumberText,
  type MonthlyPlanListRow,
  type MonthlyPlanPartInputForm,
  type MonthlyPlanPartItem
} from "./monthlyPlanDisplayUtils";
import {
  createMonthlyPlanAtom,
  deleteMonthlyPlansAtom,
  errorMessageAtom,
  filteredMonthlyPlanListAtom,
  itemListAtom,
  loadingAtom,
  monthlyPlanSearchAppliedFiltersAtom,
  monthlyPlanSearchDefaultFilters,
  monthlyPlanSearchExecutedAtom,
  type MonthlyPlanSearchFilters,
  updateMonthlyPlanAtom
} from "./store";
import { TrItemMasterZoomModal, type TrItemZoomFilterParams } from "../components/TrItemMasterZoomModal";
import { EditModalOverlay } from "../components/modal";
import { YearNumberInput } from "../components/YearNumberInput";
import {
  YEAR_NUMBER_INPUT_MIN,
  getCurrentCalendarYear,
  getDefaultYearInputValue
} from "../components/yearNumberInputUtils";
import type { TeMonthlyPlan } from "./types";
import "./styles.css";
import "./monthlyPlanMantineTable.css";

type PlanEditorMode = "create" | "update";

type PlanEditorForm = {
  planNo: string;
  year: string;
  month: string;
  processType: string;
  lotName: string;
  workDate: string;
  workTime: string;
  unitWeight: string;
  itemNo: string;
  remarks: string;
};

type EditorTouchedState = Partial<Record<keyof PlanEditorForm, boolean>> & {
  partLotNo?: boolean;
  partProductNo?: boolean;
  partLotNoField?: boolean;
  partMakeYear?: boolean;
  partCount?: boolean;
};

const isBlank = (value: string): boolean => {
  return value.trim().length === 0;
};

const isDigitsOnly = (value: string): boolean => {
  return /^\d+$/.test(value.trim());
};

const toInputDateValue = (value: string | null): string => {
  if (!value) {
    return "";
  }
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) {
    return "";
  }
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const toInputTimeValue = (value: string | null): string => {
  if (!value) {
    return "";
  }
  const m = value.match(/^(\d{1,2}):(\d{1,2})/);
  if (!m) {
    return "";
  }
  return `${String(Number(m[1])).padStart(2, "0")}:${String(Number(m[2])).padStart(2, "0")}`;
};

const toEditorForm = (plan: TeMonthlyPlan | null): PlanEditorForm => {
  if (!plan) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;
    const yyyyText = String(yyyy);
    const mmText = String(mm).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return {
      planNo: "",
      year: getDefaultYearInputValue(),
      month: String(mm),
      processType: "05",
      lotName: "",
      workDate: `${yyyyText}-${mmText}-${dd}`,
      workTime: "",
      unitWeight: "",
      itemNo: "",
      remarks: ""
    };
  }
  return {
    planNo: plan.planNo == null ? "" : String(plan.planNo),
    year: plan.year == null ? "" : String(plan.year),
    month: plan.month == null ? "" : String(plan.month),
    processType: plan.processType ?? "03",
    lotName: plan.lotName ?? "",
    workDate: toInputDateValue(plan.workDate),
    workTime: toInputTimeValue(plan.workTime),
    unitWeight: plan.unitWeight == null ? "" : String(plan.unitWeight),
    itemNo: plan.itemNo == null ? "" : String(plan.itemNo),
    remarks: plan.remarks ?? ""
  };
};

const toApiDateValue = (value: string): string => {
  const normalized = value.trim().replace(/\//g, "-");
  const m = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) {
    return normalized;
  }
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const toApiIntValue = (value: string): number | null => {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  return Number(normalized);
};

const toApiTimeValue = (value: string): string => {
  const normalized = value.trim();
  const m = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) {
    return normalized;
  }
  return `${String(Number(m[1])).padStart(2, "0")}:${String(Number(m[2])).padStart(2, "0")}:00`;
};

type PlanEditorModalProps = {
  mode: PlanEditorMode;
  initialPlan: TeMonthlyPlan | null;
  onClose: () => void;
};

const PlanEditorModal = memo(function PlanEditorModal({ mode, initialPlan, onClose }: PlanEditorModalProps) {
  const createMonthlyPlan = useSetAtom(createMonthlyPlanAtom);
  const updateMonthlyPlan = useSetAtom(updateMonthlyPlanAtom);
  const loading = useAtomValue(loadingAtom);
  const [editorPartItems, setEditorPartItems] = useState<MonthlyPlanPartItem[]>(() => parsePartItems(initialPlan?.lotPartInfo));
  const [editorForm, setEditorForm] = useState<PlanEditorForm>(() => toEditorForm(initialPlan));
  const [partInput, setPartInput] = useState<MonthlyPlanPartInputForm>(() => emptyMonthlyPlanPartInput());
  const [touched, setTouched] = useState<EditorTouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitPressed, setSubmitPressed] = useState(false);
  const canAddPartRow = useMemo(() => {
    if (isBlank(partInput.useUnitWeight)) return false;
    const numericKeys: (keyof MonthlyPlanPartInputForm)[] = [
      "lotNo",
      "partLotNo",
      "productNo",
      "makeYear",
      "count",
      "useUnitWeight"
    ];
    return numericKeys.every((key) => isBlank(partInput[key]) || isDigitsOnly(partInput[key]));
  }, [partInput]);
  const handleDeletePartRow = useCallback((rowId: string) => {
    setEditorPartItems((prev) => prev.filter((row) => row.id !== rowId));
  }, []);
  const formResetKey = useMemo(() => {
    const baseNo = initialPlan?.planNo == null ? "new" : String(initialPlan.planNo);
    return `${mode}-${baseNo}`;
  }, [initialPlan, mode]);

  useEffect(() => {
    setEditorForm(toEditorForm(initialPlan));
    setEditorPartItems(parsePartItems(initialPlan?.lotPartInfo));
    setPartInput(emptyMonthlyPlanPartInput());
    setTouched({});
    setSubmitAttempted(true);
    setSubmitPressed(false);
  }, [initialPlan]);

  const updateEditorField = (field: keyof PlanEditorForm, value: string) => {
    setEditorForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof EditorTouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldErrors = useMemo(() => {
    const nextErrors: Partial<
      Record<keyof PlanEditorForm | "partProductNo" | "partLotNo" | "partLotNoField" | "partMakeYear" | "partCount", string>
    > = {};

    if (isBlank(editorForm.year)) {
      nextErrors.year = "年は必須です。";
    }
    if (isBlank(editorForm.month)) {
      nextErrors.month = "月は必須です。";
    } else {
      const monthValue = Number(editorForm.month);
      if (!Number.isFinite(monthValue) || monthValue < 1 || monthValue > 12) {
        nextErrors.month = "月は1から12の範囲で入力してください。";
      }
    }
    if (isBlank(editorForm.processType)) {
      nextErrors.processType = "工程分類は必須です。";
    }
    if (isBlank(editorForm.workDate)) {
      nextErrors.workDate = "作業日は必須です。";
    }
    if (isBlank(editorForm.unitWeight)) {
      nextErrors.unitWeight = "梱包重量は必須です。";
    }
    if (!isBlank(editorForm.year)) {
      const yearValue = Number(editorForm.year);
      const yearMax = getCurrentCalendarYear();
      if (!Number.isFinite(yearValue) || yearValue < YEAR_NUMBER_INPUT_MIN || yearValue > yearMax) {
        nextErrors.year = `年は${YEAR_NUMBER_INPUT_MIN}から${yearMax}の範囲で入力してください。`;
      }
    }
    if (!isBlank(editorForm.itemNo) && !isDigitsOnly(editorForm.itemNo)) {
      nextErrors.itemNo = "商品NOは数値で入力してください。";
    }

    if (!isBlank(partInput.productNo) && !isDigitsOnly(partInput.productNo)) {
      nextErrors.partProductNo = "製造Noは数値で入力してください。";
    }
    if (!isBlank(partInput.lotNo) && !isDigitsOnly(partInput.lotNo)) {
      nextErrors.partLotNo = "ロットNoは数値で入力してください。";
    }
    if (!isBlank(partInput.partLotNo) && !isDigitsOnly(partInput.partLotNo)) {
      nextErrors.partLotNoField = "部品ロットNoは数値で入力してください。";
    }
    if (!isBlank(partInput.makeYear) && !isDigitsOnly(partInput.makeYear)) {
      nextErrors.partMakeYear = "年は数値で入力してください。";
    }
    if (!isBlank(partInput.count) && !isDigitsOnly(partInput.count)) {
      nextErrors.partCount = "回数は数値で入力してください。";
    }

    return nextErrors;
  }, [editorForm, partInput]);

  const shouldShowError = (field: keyof typeof fieldErrors): boolean => {
    return Boolean(fieldErrors[field]) && Boolean(submitAttempted || touched[field]);
  };

  const shouldShowErrorText = (field: keyof typeof fieldErrors): boolean => {
    return Boolean(fieldErrors[field]) && Boolean(touched[field] || submitPressed);
  };

  const activeErrorCount = useMemo(() => {
    if (!submitPressed) {
      return Object.entries(fieldErrors).filter(([key]) => touched[key as keyof typeof touched]).length;
    }
    return Object.keys(fieldErrors).length;
  }, [fieldErrors, submitPressed, touched]);

  const hasValidationError = Object.keys(fieldErrors).length > 0;

  const addPartRow = () => {
    if (!canAddPartRow) {
      markTouched("partProductNo");
      markTouched("partLotNo");
      markTouched("partLotNoField");
      markTouched("partMakeYear");
      markTouched("partCount");
      return;
    }

    const built = buildPartItemFromInput(partInput, `new-${Date.now()}-${editorPartItems.length}`);
    if (built === "missing_weight" || built === "invalid_number") {
      markTouched("partProductNo");
      return;
    }

    setEditorPartItems((prev) => [...prev, built]);
    setPartInput(emptyMonthlyPlanPartInput());
    setTouched((prev) => ({
      ...prev,
      partProductNo: false,
      partLotNo: false,
      partLotNoField: false,
      partMakeYear: false,
      partCount: false
    }));
  };

  const handleEditorSubmit = async () => {
    setSubmitPressed(true);
    if (hasValidationError) {
      return;
    }

    const payload = {
      planNo: editorForm.planNo.trim().length > 0 ? Number(editorForm.planNo) : null,
      year: toApiIntValue(editorForm.year),
      month: toApiIntValue(editorForm.month),
      processType: editorForm.processType.trim(),
      lotName: editorForm.lotName.trim(),
      workDate: toApiDateValue(editorForm.workDate),
      workTime: toApiTimeValue(editorForm.workTime),
      unitWeight: editorForm.unitWeight.trim().length > 0 ? Number(editorForm.unitWeight) : null,
      itemNo: editorForm.itemNo.trim().length > 0 ? Number(editorForm.itemNo) : null,
      remarks: editorForm.remarks.trim(),
      lotPartInfo: editorPartItems.map((item) => partItemToApiRecord(item))
    };

    const result = mode === "create" ? await createMonthlyPlan(payload) : await updateMonthlyPlan(payload);
    if (result) {
      onClose();
    }
  };

  return (
    <EditModalOverlay mode={mode} onClose={onClose}>
      <section className="modalPanel editorPanel" onClick={(event) => event.stopPropagation()}>
        <header className="modalHeader">
          <h2 className="modalTitle">月次計画 {mode === "create" ? "登録" : "変更"}</h2>
          <button className="modalCloseButton" type="button" onClick={onClose}>
            閉じる
          </button>
        </header>

        <div className="editorFormGrid" key={formResetKey}>
          <label className="editorField">
            <span>計画NO</span>
            <input
              value={editorForm.planNo}
              onChange={(event) => updateEditorField("planNo", event.target.value)}
              disabled
              type="text"
            />
          </label>
          <label className="editorField">
            <span>年</span>
            <YearNumberInput
              value={editorForm.year}
              onChange={(year) => updateEditorField("year", year)}
              onBlur={() => markTouched("year")}
              className={shouldShowError("year") ? "inputError" : ""}
            />
            {shouldShowErrorText("year") && <span className="fieldErrorText">{fieldErrors.year}</span>}
          </label>
          <label className="editorField">
            <span>月</span>
            <input
              value={editorForm.month}
              onChange={(event) => updateEditorField("month", event.target.value)}
              onBlur={() => markTouched("month")}
              className={shouldShowError("month") ? "inputError" : ""}
              min={1}
              max={12}
              type="number"
            />
            {shouldShowErrorText("month") && <span className="fieldErrorText">{fieldErrors.month}</span>}
          </label>
          <label className="editorField">
            <span>工程分類</span>
            <select
              value={editorForm.processType}
              onChange={(event) => updateEditorField("processType", event.target.value)}
              onBlur={() => markTouched("processType")}
              className={shouldShowError("processType") ? "inputError" : ""}
            >
              <option value="02">02:荒茶ブ</option>
              <option value="03">03:仕上○</option>
              <option value="04">04:火入●</option>
              <option value="05">05:仕上ブ</option>
            </select>
            {shouldShowErrorText("processType") && <span className="fieldErrorText">{fieldErrors.processType}</span>}
          </label>
          <label className="editorField editorFieldWide">
            <span>ロット名</span>
            <input
              value={editorForm.lotName}
              onChange={(event) => updateEditorField("lotName", event.target.value)}
              type="text"
            />
          </label>
          <label className="editorField">
            <span>作業日</span>
            <input
              value={editorForm.workDate}
              onChange={(event) => updateEditorField("workDate", event.target.value)}
              onBlur={() => markTouched("workDate")}
              className={shouldShowError("workDate") ? "inputError" : ""}
              type="date"
            />
            {shouldShowErrorText("workDate") && <span className="fieldErrorText">{fieldErrors.workDate}</span>}
          </label>
          <label className="editorField">
            <span>作業時間</span>
            <input
              value={editorForm.workTime}
              onChange={(event) => updateEditorField("workTime", event.target.value)}
              type="time"
            />
          </label>
          <label className="editorField">
            <span>梱包重量</span>
            <input
              value={editorForm.unitWeight}
              onChange={(event) => updateEditorField("unitWeight", event.target.value)}
              onBlur={() => markTouched("unitWeight")}
              className={shouldShowError("unitWeight") ? "inputError" : ""}
              type="number"
            />
            {shouldShowErrorText("unitWeight") && <span className="fieldErrorText">{fieldErrors.unitWeight}</span>}
          </label>
          <label className="editorField">
            <span>商品NO</span>
            <input
              value={editorForm.itemNo}
              onChange={(event) => updateEditorField("itemNo", event.target.value)}
              onBlur={() => markTouched("itemNo")}
              className={shouldShowError("itemNo") ? "inputError" : ""}
              inputMode="numeric"
              pattern="[0-9]*"
              type="text"
            />
            {shouldShowErrorText("itemNo") && <span className="fieldErrorText">{fieldErrors.itemNo}</span>}
          </label>
          <label className="editorField editorFieldWide">
            <span>摘要</span>
            <input
              value={editorForm.remarks}
              onChange={(event) => updateEditorField("remarks", event.target.value)}
              type="text"
            />
          </label>
        </div>

        <div className="editorPartsHeader">
          <h3>使用部品情報</h3>
        </div>
        <div className="editorPartsInputGrid">
          <label className="editorPartsInputField">
            <span>ロットNo</span>
            <input
              className={`editorPartsInput ${shouldShowError("partLotNo") ? "inputError" : ""}`}
              value={partInput.lotNo}
              onChange={(event) => setPartInput((prev) => ({ ...prev, lotNo: event.target.value }))}
              onBlur={() => markTouched("partLotNo")}
              inputMode="numeric"
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>工程</span>
            <select
              className="editorPartsInput"
              value={partInput.processType}
              onChange={(event) => setPartInput((prev) => ({ ...prev, processType: event.target.value }))}
            >
              <option value="">（空白）</option>
              <option value="02">02:荒茶ブ</option>
              <option value="03">03:仕上○</option>
              <option value="04">04:火入●</option>
              <option value="05">05:仕上ブ</option>
            </select>
          </label>
          <label className="editorPartsInputField">
            <span>部品ロットNo</span>
            <input
              className={`editorPartsInput ${shouldShowError("partLotNoField") ? "inputError" : ""}`}
              value={partInput.partLotNo}
              onChange={(event) => setPartInput((prev) => ({ ...prev, partLotNo: event.target.value }))}
              onBlur={() => markTouched("partLotNoField")}
              inputMode="numeric"
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>製造No</span>
            <input
              className={`editorPartsInput ${shouldShowError("partProductNo") ? "inputError" : ""}`}
              value={partInput.productNo}
              onChange={(event) => setPartInput((prev) => ({ ...prev, productNo: event.target.value }))}
              onBlur={() => markTouched("partProductNo")}
              inputMode="numeric"
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>ロット名</span>
            <input
              className="editorPartsInput"
              value={partInput.lotName}
              onChange={(event) => setPartInput((prev) => ({ ...prev, lotName: event.target.value }))}
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>年</span>
            <input
              className={`editorPartsInput ${shouldShowError("partMakeYear") ? "inputError" : ""}`}
              value={partInput.makeYear}
              onChange={(event) => setPartInput((prev) => ({ ...prev, makeYear: event.target.value }))}
              onBlur={() => markTouched("partMakeYear")}
              inputMode="numeric"
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>回数</span>
            <input
              className={`editorPartsInput ${shouldShowError("partCount") ? "inputError" : ""}`}
              value={partInput.count}
              onChange={(event) => setPartInput((prev) => ({ ...prev, count: event.target.value }))}
              onBlur={() => markTouched("partCount")}
              inputMode="numeric"
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>使用重量(kg)</span>
            <input
              className="editorPartsInput"
              value={partInput.useUnitWeight}
              onChange={(event) => setPartInput((prev) => ({ ...prev, useUnitWeight: event.target.value }))}
              type="number"
              step="0.1"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField editorPartsInputFieldWide">
            <span>備考</span>
            <input
              className="editorPartsInput"
              value={partInput.remarks}
              onChange={(event) => setPartInput((prev) => ({ ...prev, remarks: event.target.value }))}
              type="text"
              autoComplete="off"
            />
          </label>
          <div className="editorPartsInputField editorPartsAddCell">
            <button className="actionButton" type="button" onClick={addPartRow} disabled={!canAddPartRow}>
              追加
            </button>
          </div>
        </div>
        {shouldShowErrorText("partLotNo") && <p className="fieldErrorText partsErrorText">{fieldErrors.partLotNo}</p>}
        {shouldShowErrorText("partLotNoField") && (
          <p className="fieldErrorText partsErrorText">{fieldErrors.partLotNoField}</p>
        )}
        {shouldShowErrorText("partProductNo") && (
          <p className="fieldErrorText partsErrorText">{fieldErrors.partProductNo}</p>
        )}
        {shouldShowErrorText("partMakeYear") && (
          <p className="fieldErrorText partsErrorText">{fieldErrors.partMakeYear}</p>
        )}
        {shouldShowErrorText("partCount") && <p className="fieldErrorText partsErrorText">{fieldErrors.partCount}</p>}
        <div className="editorPartsGridWrap">
          <MantineZoomProvider>
            <MonthlyPlanPartMantineTable
              rows={editorPartItems}
              variant="full"
              onDeleteRow={handleDeletePartRow}
            />
          </MantineZoomProvider>
        </div>

        <div className="editorFooter">
          {activeErrorCount > 0 && <p className="editorErrorSummary">入力エラー {activeErrorCount} 件</p>}
          <button className="actionButton" type="button" onClick={() => { void handleEditorSubmit(); }} disabled={loading || hasValidationError}>
            {mode === "create" ? "登録" : "変更"}
          </button>
        </div>
      </section>
    </EditModalOverlay>
  );
});

export default function MonthlyPlanPage() {
  const monthlyPlanList = useAtomValue(filteredMonthlyPlanListAtom);
  const searchExecuted = useAtomValue(monthlyPlanSearchExecutedAtom);
  const itemList = useAtomValue(itemListAtom);
  const loading = useAtomValue(loadingAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const masterLoading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(monthlyPlanMasterErrorAtom);
  const deleteMonthlyPlans = useSetAtom(deleteMonthlyPlansAtom);
  const setAppliedMonthlyFilters = useSetAtom(monthlyPlanSearchAppliedFiltersAtom);
  const setMonthlySearchExecuted = useSetAtom(monthlyPlanSearchExecutedAtom);
  const [selectedPlan, setSelectedPlan] = useState<TeMonthlyPlan | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [editorMode, setEditorMode] = useState<PlanEditorMode>("create");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialPlan, setEditorInitialPlan] = useState<TeMonthlyPlan | null>(null);
  const [searchDraft, setSearchDraft] = useState<MonthlyPlanSearchFilters>(() => monthlyPlanSearchDefaultFilters());
  const [searchPanelOpen, setSearchPanelOpen] = useState(true);
  const [itemZoomOpen, setItemZoomOpen] = useState(false);

  const handleMonthlySearch = () => {
    setAppliedMonthlyFilters({ ...searchDraft });
    setMonthlySearchExecuted(true);
    setSelectedRowIds(new Set());
  };

  /** 商品マスター ZOOM：システム区分のみ指定（有機区分・商品分類NOは条件に含めない） */
  const monthlyPlanTrItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(
    () => ({
      systemClass: "2"
    }),
    []
  );

  const rowList = useMemo<MonthlyPlanListRow[]>(() => {
    const itemNameByNo = new Map<number, string>();
    for (const item of itemList) {
      if (item.itemNo != null && item.itemName) {
        itemNameByNo.set(item.itemNo, item.itemName);
      }
    }

    return monthlyPlanList.map((row) => {
      const finishedTeaName = row.itemNo == null ? "" : (itemNameByNo.get(row.itemNo) ?? "");
      return {
        ...row,
        finishedTeaName
      };
    });
  }, [itemList, monthlyPlanList]);

  const selectedPartItems = useMemo(() => {
    return parsePartItems(selectedPlan?.lotPartInfo);
  }, [selectedPlan]);

  const handleDeleteClick = async () => {
    const selectedRows = rowList.filter((row) => selectedRowIds.has(monthlyPlanRowId(row)));
    if (selectedRows.length === 0) {
      return;
    }

    const result = await deleteMonthlyPlans(selectedRows);
    if (result) {
      const deletedKeys = new Set(selectedRows.map((row) => monthlyPlanRowId(row)));
      setSelectedRowIds(new Set());
      if (selectedPlan && deletedKeys.has(monthlyPlanRowId(selectedPlan))) {
        setSelectedPlan(null);
      }
    }
  };

  const selectedRows = useMemo(() => {
    return rowList.filter((row) => selectedRowIds.has(monthlyPlanRowId(row)));
  }, [rowList, selectedRowIds]);

  const handleOpenDetail = useCallback((row: MonthlyPlanListRow) => {
    setSelectedPlan(row);
  }, []);

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditorInitialPlan(null);
    setIsEditorOpen(true);
  };

  const openUpdateEditor = () => {
    if (selectedRows.length !== 1) {
      return;
    }
    const target = selectedRows[0];
    setEditorMode("update");
    setEditorInitialPlan(target);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">月次計画</h1>
      </header>

      {masterLoading && <p className="status">マスタ読み込み中...</p>}
      {masterError && <p className="status error">{masterError}</p>}
      {loading && <p className="status">処理中...</p>}
      {errorMessage && <p className="status error">{errorMessage}</p>}

      <section className="searchPanel">
        <button
          type="button"
          className="searchPanelToggle"
          onClick={() => setSearchPanelOpen((v) => !v)}
          aria-expanded={searchPanelOpen}
        >
          検索条件
          <span className="searchPanelToggleIcon">{searchPanelOpen ? " ▼" : " ▶"}</span>
        </button>
        {searchPanelOpen && (
          <div className="searchPanelBody">
            <div className="searchFields">
              <label className="searchField">
                <span className="searchFieldLabel">年</span>
                <YearNumberInput
                  className="searchControl"
                  value={searchDraft.year}
                  onChange={(year) => setSearchDraft((p) => ({ ...p, year }))}
                  allowEmpty
                />
              </label>
              <label className="searchField">
                <span className="searchFieldLabel">月</span>
                <input
                  className="searchControl"
                  type="number"
                  min={1}
                  max={12}
                  placeholder="（空白）"
                  value={searchDraft.month}
                  onChange={(e) => setSearchDraft((p) => ({ ...p, month: e.target.value }))}
                />
              </label>
              <label className="searchField">
                <span className="searchFieldLabel">工程分類</span>
                <select
                  className="searchControl"
                  value={searchDraft.processType}
                  onChange={(e) => setSearchDraft((p) => ({ ...p, processType: e.target.value }))}
                >
                  <option value="">（空白）</option>
                  <option value="02">02:荒茶ブ</option>
                  <option value="03">03:仕上○</option>
                  <option value="04">04:火入●</option>
                  <option value="05">05:仕上ブ</option>
                </select>
              </label>
              <label className="searchField">
                <span className="searchFieldLabel">ロット名</span>
                <input
                  className="searchControl searchControlWide"
                  type="text"
                  value={searchDraft.lotName}
                  onChange={(e) => setSearchDraft((p) => ({ ...p, lotName: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="searchField">
                <span className="searchFieldLabel">作業日</span>
                <input
                  className="searchControl"
                  type="date"
                  value={searchDraft.workDate}
                  onChange={(e) => setSearchDraft((p) => ({ ...p, workDate: e.target.value }))}
                />
              </label>
              <div className="searchFieldItemZoomGroup">
                <label className="searchField">
                  <span className="searchFieldLabel">商品NO</span>
                  <input
                    className="searchControl"
                    type="text"
                    inputMode="numeric"
                    value={searchDraft.itemNo}
                    onChange={(e) => setSearchDraft((p) => ({ ...p, itemNo: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <label className="searchField">
                  <span className="searchFieldLabel">商品名</span>
                  <input
                    className="searchControl searchControlItemName"
                    type="text"
                    value={searchDraft.itemName}
                    onChange={(e) => setSearchDraft((p) => ({ ...p, itemName: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <div className="searchField searchFieldZoomButtonWrap">
                  <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
                  <button type="button" className="zoomOpenButton" onClick={() => setItemZoomOpen(true)}>
                    仕上茶
                  </button>
                </div>
              </div>
              <div className="searchActions">
                <button className="searchSubmitButton" type="button" onClick={handleMonthlySearch}>
                  検索
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="tableWrap">
        <div className="listToolbar">
          <button className="actionButton" type="button" onClick={openCreateEditor}>
            登録
          </button>
          <button
            className="actionButton"
            type="button"
            onClick={openUpdateEditor}
            disabled={selectedRows.length !== 1}
          >
            更新
          </button>
          <button
            className="actionButton delete"
            type="button"
            onClick={() => {
              void handleDeleteClick();
            }}
            disabled={loading || selectedRowIds.size === 0}
          >
            削除
          </button>
        </div>
        <MantineZoomProvider>
          <MonthlyPlanListMantineTable
            rows={rowList}
            getRowId={monthlyPlanRowId}
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
            onOpenDetail={handleOpenDetail}
            loading={masterLoading}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {selectedPlan && (
        <EditModalOverlay mode="view" onClose={() => setSelectedPlan(null)}>
          <section className="modalPanel modalPanelPartsDetail" onClick={(event) => event.stopPropagation()}>
            <header className="modalHeader">
              <h2 className="modalTitle">使用部品情報</h2>
              <button className="modalCloseButton" type="button" onClick={() => setSelectedPlan(null)}>
                閉じる
              </button>
            </header>
            <p className="modalCaption">
              計画NO: {toNumberText(selectedPlan.planNo)} / ロット名: {selectedPlan.lotName ?? ""}
            </p>
            <div className="modalTableWrap">
              <MantineZoomProvider>
                <MonthlyPlanPartMantineTable rows={selectedPartItems} variant="full" />
              </MantineZoomProvider>
            </div>
          </section>
        </EditModalOverlay>
      )}

      {isEditorOpen && (
        <PlanEditorModal mode={editorMode} initialPlan={editorInitialPlan} onClose={closeEditor} />
      )}

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={searchDraft.itemNo}
        initialName={searchDraft.itemName}
        filterParams={monthlyPlanTrItemZoomFilterParams}
        onSelect={(code, name) => {
          setSearchDraft((p) => ({ ...p, itemNo: code, itemName: name }));
        }}
      />
    </main>
  );
}
