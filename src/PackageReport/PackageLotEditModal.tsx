/**
 * 製造報告書登録モーダル（EditWindow.xaml 相当）
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import {
  TrItemMasterZoomModal,
  type TrItemZoomFilterParams
} from "../components/TrItemMasterZoomModal";
import { Factory3StocZoomModal } from "../components/Factory3StocZoomModal";
import { masterEntityCacheAtom, masterTrItemsAtom } from "../repository/masterData";
import {
  applyFactory3StocToLotRow,
  type PackageLotDetailRowIndex
} from "./applyFactory3StocToLotRow";
import { clearAndCompactLotDetailRow, compactPackageLotUseRowsInForm } from "./packageLotDetailRows";
import {
  collectOtherRowProductNos,
  filterFactory3StocForPackageLot
} from "./filterFactory3StocForPackageLot";
import {
  emptyPackageLotUseRowFields,
  isSameProductZoomSelection
} from "./clearPackageLotUseRows";
import { PkgEditRemQuantityCell } from "./PkgEditRemQuantityCell";
import {
  applyRemQuantityBlur,
  applyRemQuantityChange,
  isValidPackageLotRemQuantityTyping,
  maxRemQuantityFromOut,
  outQuantityForRow,
  validateRemQuantityAgainstOut
} from "./packageLotRemQuantityInput";
import {
  resolveUseTeaPartsFromItemBom,
  useTeaPartsToFormFields
} from "./resolveUseTeaPartsFromItemBom";
import { organicClassFieldsFromTrItem } from "./resolveOrganicClassFromTrItem";
import {
  calculatePackageLotBestBeforeDate,
  formatPackageLotPackagingDate
} from "./calculatePackageLotBestBeforeDate";
import {
  canRegisterPackageLot,
  computePackageLotMandatoryHighlight
} from "./packageLotMandatoryFields";
import { PACKAGE_LOT_STATUS_COMPLETE, isPackageOrganicTea } from "./packageLotDisplay";
import {
  confirmPackageLotStockAtom,
  createPackageLotAtom,
  deletePackageLotAtom,
  packageLotMutationErrorAtom,
  updatePackageLotAtom
} from "./store";
import { previewPackageGradeReportViaHelper, previewPackageReportViaHelper } from "./reportHelperApi";
import type {
  PackageLotEditBeforeAfter,
  PackageLotEditFormData,
  PackageLotEditMode,
  PackageLotEditTimeHm,
  PackageLotEditTimeRange
} from "./packageLotEditTypes";
import { EditModalOverlay } from "../components/modal";
import { useBusyTask } from "../ui/useBusyTask";
import "./packageLotEditModal.css";

const integerFormatter = new Intl.NumberFormat("ja-JP");

const stripCommaDigits = (value: string): string => value.replace(/,/g, "").replace(/\D/g, "");

const formatCommaInteger = (value: string): string => {
  const digits = stripCommaDigits(value);
  if (!digits) return "";
  return integerFormatter.format(Number(digits));
};

type Props = {
  open: boolean;
  mode: PackageLotEditMode;
  initialForm: PackageLotEditFormData;
  onClose: () => void;
  onDeleted?: () => void;
};

/** `type="time"` 用に "HH:MM" へ正規化（空欄可） */
const formatTimeValue = (hh: string, mm: string): string => {
  const h = hh.trim();
  const m = mm.trim();
  if (!h && !m) return "";
  const hh2 = String(Number(h || "0")).padStart(2, "0");
  const mm2 = String(Number(m || "0")).padStart(2, "0");
  return `${hh2}:${mm2}`;
};

const splitTimeValue = (value: string): PackageLotEditTimeHm => {
  if (!value.trim()) return { hh: "", mm: "" };
  const [hh = "", mm = ""] = value.split(":");
  return { hh, mm };
};

function TimeSingleField({
  value,
  onChange,
  ariaLabel,
  readOnly = false,
  highlightEmpty = false
}: {
  value: PackageLotEditTimeHm;
  onChange: (next: PackageLotEditTimeHm) => void;
  ariaLabel: string;
  readOnly?: boolean;
  highlightEmpty?: boolean;
}) {
  return (
    <input
      className={`pkgEditInput pkgEditEnvTimeSingle${highlightEmpty ? " pkgEditMandatoryEmpty" : ""}`}
      type="time"
      value={formatTimeValue(value.hh, value.mm)}
      readOnly={readOnly}
      disabled={readOnly}
      onChange={(e) => onChange(splitTimeValue(e.target.value))}
      aria-label={ariaLabel}
    />
  );
}

function TimeRangeField({
  value,
  onChange,
  ariaLabelStart,
  ariaLabelEnd,
  readOnly = false,
  highlightStartEmpty = false,
  highlightEndEmpty = false
}: {
  value: PackageLotEditTimeRange;
  onChange: (next: PackageLotEditTimeRange) => void;
  ariaLabelStart: string;
  ariaLabelEnd: string;
  readOnly?: boolean;
  highlightStartEmpty?: boolean;
  highlightEndEmpty?: boolean;
}) {
  return (
    <div className="pkgEditEnvRangeCell">
      <input
        className={`pkgEditInput pkgEditEnvTimeRange${highlightStartEmpty ? " pkgEditMandatoryEmpty" : ""}`}
        type="time"
        value={formatTimeValue(value.start.hh, value.start.mm)}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) =>
          onChange({ ...value, start: splitTimeValue(e.target.value) })
        }
        aria-label={ariaLabelStart}
      />
      <span className="pkgEditTimeSep">～</span>
      <input
        className={`pkgEditInput pkgEditEnvTimeRange${highlightEndEmpty ? " pkgEditMandatoryEmpty" : ""}`}
        type="time"
        value={formatTimeValue(value.end.hh, value.end.mm)}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) => onChange({ ...value, end: splitTimeValue(e.target.value) })}
        aria-label={ariaLabelEnd}
      />
    </div>
  );
}

/** 作業前後チェック（テーブル用・チェックボックス2セル） */
function BeforeAfterCheckboxCells({
  value,
  onChange,
  readOnly = false
}: {
  value: PackageLotEditBeforeAfter;
  onChange: (next: PackageLotEditBeforeAfter) => void;
  readOnly?: boolean;
}) {
  return (
    <>
      <td className="pkgEditBaCheckCell">
        <input
          type="checkbox"
          checked={value.before}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, before: e.target.checked })}
          aria-label="前"
        />
      </td>
      <td className="pkgEditBaCheckCell">
        <input
          type="checkbox"
          checked={value.after}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, after: e.target.checked })}
          aria-label="後"
        />
      </td>
    </>
  );
}

/** 作業前後チェック（1セル内・中央縦罫線なし） */
function BeforeAfterCheckboxMergedCell({
  value,
  onChange,
  readOnly = false,
  rowSpan
}: {
  value: PackageLotEditBeforeAfter;
  onChange: (next: PackageLotEditBeforeAfter) => void;
  readOnly?: boolean;
  rowSpan?: number;
}) {
  return (
    <td className="pkgEditBaCheckCellMerged" rowSpan={rowSpan}>
      <div className="pkgEditBaCheckPair">
        <input
          type="checkbox"
          checked={value.before}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, before: e.target.checked })}
          aria-label="前"
        />
        <input
          type="checkbox"
          checked={value.after}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, after: e.target.checked })}
          aria-label="後"
        />
      </div>
    </td>
  );
}

function BeforeAfterChecks({
  value,
  onChange,
  labelBefore = "作業前",
  labelAfter = "作業後",
  readOnly = false
}: {
  value: PackageLotEditBeforeAfter;
  onChange: (next: PackageLotEditBeforeAfter) => void;
  labelBefore?: string;
  labelAfter?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="pkgEditBaChecks">
      <label>
        {labelBefore}
        <input
          type="checkbox"
          checked={value.before}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, before: e.target.checked })}
        />
      </label>
      <label>
        {labelAfter}
        <input
          type="checkbox"
          checked={value.after}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, after: e.target.checked })}
        />
      </label>
    </div>
  );
}

function PkgEditLotCell({
  row,
  partLotNo,
  onOpenZoom,
  onClearRow,
  isReadOnly,
  useTeaReady
}: {
  row: PackageLotDetailRowIndex;
  partLotNo: string;
  onOpenZoom: (row: PackageLotDetailRowIndex) => void;
  onClearRow: (row: PackageLotDetailRowIndex) => void;
  isReadOnly: boolean;
  useTeaReady: boolean;
}) {
  const zoomDisabled = isReadOnly || !useTeaReady;
  const canClear = !isReadOnly && partLotNo.trim() !== "";
  const zoomTitle = useTeaReady
    ? "第3工場仕上茶在庫ZOOM"
    : "先に製品名を選択してください";

  return (
    <div className="pkgEditLotCell pkgEditDetailDataCell">
      <input
        className="pkgEditLotNoInput"
        type="text"
        readOnly
        value={partLotNo}
        aria-label={`ロット${row}`}
      />
      <button
        type="button"
        className="pkgEditLotZoomBtn"
        disabled={zoomDisabled}
        title={zoomTitle}
        onClick={() => onOpenZoom(row)}
        aria-label={`ロット${row} 在庫ZOOM`}
      >
        Z
      </button>
      <button
        type="button"
        className="pkgEditLotClearBtn"
        disabled={!canClear}
        title="行クリア"
        onClick={() => onClearRow(row)}
        aria-label={`ロット${row} 行クリア`}
      >
        ×
      </button>
    </div>
  );
}

function PackageLotEditModalContent({
  mode,
  initialForm,
  onClose,
  onDeleted
}: Omit<Props, "open">) {
  const runBusy = useBusyTask();
  const cache = useAtomValue(masterEntityCacheAtom);
  const trItems = useAtomValue(masterTrItemsAtom);
  const mutationError = useAtomValue(packageLotMutationErrorAtom);
  const setMutationError = useSetAtom(packageLotMutationErrorAtom);
  const createPackageLot = useSetAtom(createPackageLotAtom);
  const updatePackageLot = useSetAtom(updatePackageLotAtom);
  const deletePackageLot = useSetAtom(deletePackageLotAtom);
  const confirmPackageLotStock = useSetAtom(confirmPackageLotStockAtom);
  const [form, setForm] = useState<PackageLotEditFormData>(() => ({ ...initialForm }));
  const [localError, setLocalError] = useState("");
  const [itemZoomOpen, setItemZoomOpen] = useState(false);
  const [factory3StocZoomRow, setFactory3StocZoomRow] = useState<PackageLotDetailRowIndex | null>(
    null
  );
  const [remQuantityErrors, setRemQuantityErrors] = useState<
    Partial<Record<PackageLotDetailRowIndex, string>>
  >({});

  const setRemQuantityError = (row: PackageLotDetailRowIndex, message: string | null) => {
    setRemQuantityErrors((prev) => {
      const next = { ...prev };
      if (message) next[row] = message;
      else delete next[row];
      return next;
    });
  };

  const handleRemQuantityChange = (row: PackageLotDetailRowIndex, raw: string) => {
    if (!isValidPackageLotRemQuantityTyping(raw)) return;
    setForm((f) => {
      const next = applyRemQuantityChange(f, row, raw);
      setRemQuantityError(
        row,
        validateRemQuantityAgainstOut(raw, outQuantityForRow(f, row))
      );
      return next;
    });
  };

  const handleRemQuantityBlur = (row: PackageLotDetailRowIndex) => {
    setForm((f) => {
      const next = applyRemQuantityBlur(f, row);
      setRemQuantityError(
        row,
        validateRemQuantityAgainstOut(
          row === 1 ? next.remQuantity1 : row === 2 ? next.remQuantity2 : next.remQuantity3,
          outQuantityForRow(next, row)
        )
      );
      return next;
    });
  };

  const remQuantityErrorMessage = useMemo(() => {
    for (const row of [1, 2, 3] as const) {
      const msg = remQuantityErrors[row];
      if (msg) return msg;
    }
    return null;
  }, [remQuantityErrors]);

  useEffect(() => {
    setMutationError(null);
    setLocalError("");
  }, [setMutationError]);

  const headerError = localError || mutationError || "";

  const mandatoryHighlight = useMemo(
    () => computePackageLotMandatoryHighlight(form),
    [form]
  );

  const saveFormSnapshot = (): PackageLotEditFormData => compactPackageLotUseRowsInForm(form);

  const handleRegister = async () => {
    setLocalError("");
    setMutationError(null);
    const ok = await runBusy(async () => {
      const result = await createPackageLot(saveFormSnapshot());
      return result.ok;
    }, "登録処理中…");
    if (ok) onClose();
  };

  const handleUpdate = async () => {
    setLocalError("");
    setMutationError(null);
    const snapshot = saveFormSnapshot();
    const result = await runBusy(() => updatePackageLot(snapshot), "変更処理中…");
    if (result.ok) onClose();
  };

  const handlePreviewReport = async () => {
    setLocalError("");
    setMutationError(null);
    try {
      const snapshot = saveFormSnapshot();
      await runBusy(() => previewPackageReportViaHelper(snapshot, mode), "報告書プレビューを起動中…");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "報告書プレビューの起動に失敗しました。");
    }
  };

  const handlePreviewGradeSheet = async () => {
    setLocalError("");
    setMutationError(null);
    try {
      const snapshot = saveFormSnapshot();
      await runBusy(() => previewPackageGradeReportViaHelper(snapshot, mode), "格付表プレビューを起動中…");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "格付表プレビューの起動に失敗しました。");
    }
  };

  const handleConfirmStock = async () => {
    setLocalError("");
    setMutationError(null);
    const snapshot = saveFormSnapshot();
    const result = await runBusy(() => confirmPackageLotStock(snapshot), "在庫確定処理中…");
    if (result.ok) onClose();
  };

  const handleDelete = async () => {
    const productNo = form.productNo.trim();
    if (!productNo) {
      setLocalError("製造Noが不正です。");
      return;
    }
    if (!window.confirm(`製造No ${productNo} を削除します。よろしいですか？`)) {
      return;
    }
    setLocalError("");
    setMutationError(null);
    const ok = await runBusy(async () => deletePackageLot(form), "削除処理中…");
    if (ok) {
      onDeleted?.();
      onClose();
    }
  };

  const applyProductZoomSelection = (code: string, name: string) => {
    const itemNo = code.trim();
    const productName = name.trim();

    setForm((f) => {
      if (isSameProductZoomSelection(f, itemNo, productName)) {
        return f;
      }
      const useTeaParts = resolveUseTeaPartsFromItemBom(cache, trItems, itemNo);
      return {
        ...f,
        itemNo,
        productName,
        ...organicClassFieldsFromTrItem(trItems, itemNo),
        ...useTeaPartsToFormFields(useTeaParts),
        ...emptyPackageLotUseRowFields()
      };
    });
    setFactory3StocZoomRow(null);
    setRemQuantityErrors({});
  };

  const handleClearLotRow = (row: PackageLotDetailRowIndex) => {
    setForm((f) => clearAndCompactLotDetailRow(f, row));
    setRemQuantityErrors({});
  };

  const packageTrItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(
    () => ({ systemClass: "1" }),
    []
  );

  const useTeaItemNo = form.useTeaItemNo1;
  const useTeaReady = useTeaItemNo.trim() !== "";

  const factory3StocCandidates = useMemo(() => {
    if (factory3StocZoomRow == null) return [];
    const exclude = collectOtherRowProductNos(
      [form.partLotNo1, form.partLotNo2, form.partLotNo3],
      factory3StocZoomRow - 1
    );
    return filterFactory3StocForPackageLot(cache.vi_factory3_stoc, useTeaItemNo, exclude);
  }, [
    cache.vi_factory3_stoc,
    useTeaItemNo,
    factory3StocZoomRow,
    form.partLotNo1,
    form.partLotNo2,
    form.partLotNo3
  ]);

  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isView = mode === "view";
  const isReadOnly = isView;
  /** 茶区分は tr_item 由来のため手入力不可 */
  const organicClassLocked = true;
  const canConfirmStock =
    isUpdate && form.lotStatusCode.trim() === PACKAGE_LOT_STATUS_COMPLETE;
  const canRegister = isCreate && canRegisterPackageLot(form);
  const canOpenReport = isUpdate || isView;
  const canOpenGradeSheet = (isUpdate || isView) && isPackageOrganicTea(form.organicClass);
  const bestBeforeDisplay = useMemo(
    () => calculatePackageLotBestBeforeDate(form.workDate),
    [form.workDate]
  );
  const packagingDateDisplay = useMemo(
    () => formatPackageLotPackagingDate(form.workDate),
    [form.workDate]
  );

  return (
    <div className="pkgEditWindow" onClick={(e) => e.stopPropagation()}>
      <div className="pkgEditWindowHeader">
        <h1 className="pkgEditWindowTitle">製造報告書登録画面</h1>
        <button type="button" className="pkgEditCloseBtn" onClick={onClose}>
          閉じる
        </button>
      </div>
      <section className="pkgEditPanel" aria-labelledby="pkg-edit-title">
        <div className="pkgEditForm">
          <header className="pkgEditToolbar">
            <h2 id="pkg-edit-title" className="pkgEditToolbarTitle">
              製造報告書（パッケージ）
            </h2>
            <button
              type="button"
              disabled={!canRegister}
              title={
                canRegister
                  ? "登録"
                  : isCreate
                    ? "製品名ZOOMと使用茶品名を設定してください"
                    : "登録"
              }
              onClick={() => void handleRegister()}
            >
              登録
            </button>
            <button type="button" disabled={!isUpdate} title="変更" onClick={() => void handleUpdate()}>
              変更
            </button>
            <button type="button" disabled={!isUpdate} title="削除" onClick={() => void handleDelete()}>
              削除
            </button>
            <button
              type="button"
              disabled={!canOpenReport}
              title={
                canOpenReport
                  ? "ローカル帳票ヘルパーで報告書を開く"
                  : isCreate
                    ? "変更・表示モードでのみ利用できます"
                    : "報告書"
              }
              onClick={() => void handlePreviewReport()}
            >
              報告書
            </button>
            <button
              type="button"
              disabled={!canOpenGradeSheet}
              title={
                canOpenGradeSheet
                  ? "ローカル帳票ヘルパーで格付表を開く"
                  : isCreate
                    ? "変更・表示モードでのみ利用できます"
                    : !isPackageOrganicTea(form.organicClass)
                      ? "茶区分が有機のときのみ利用できます"
                      : "格付表"
              }
              onClick={() => void handlePreviewGradeSheet()}
            >
              格付表
            </button>
            <button
              type="button"
              disabled={!canConfirmStock}
              title={
                canConfirmStock
                  ? "在庫確定"
                  : "ロット状態が完了の変更保存後に利用できます"
              }
              onClick={() => void handleConfirmStock()}
            >
              在庫確定
            </button>
          </header>
          {headerError ? (
            <p className="pkgEditRemQuantityError" role="alert">
              {headerError}
            </p>
          ) : null}

          {/* 製造No・商品名ZOOM */}
          <div className="pkgEditRow pkgEditHeaderRow">
            <div className="pkgEditCellLabel pkgEditHeaderProductNo">製造No</div>
            <div className="pkgEditCellBody pkgEditHeaderProductNoVal">
              <div className="pkgEditProductNoText">
                <span>{form.organicClassPrefix || " "}</span>
                <span>-</span>
                <span>{form.productNo || " "}</span>
              </div>
            </div>
            <button
              type="button"
              className="pkgEditZoomButton pkgEditHeaderItemZoomBtn"
              disabled={isReadOnly}
              onClick={() => setItemZoomOpen(true)}
            >
              製品名
            </button>
            <div className="pkgEditCellBody pkgEditHeaderItemZoom">
              <div className="pkgEditItemZoomFields">
                <div className="pkgEditItemZoomCell pkgEditItemZoomNoCell">
                  <input
                    className={`pkgEditInput pkgEditInputReadonly pkgEditItemZoomNo${mandatoryHighlight.productItemNo ? " pkgEditMandatoryEmpty" : ""}`}
                    type="text"
                    readOnly
                    value={form.itemNo}
                    aria-label="商品No"
                  />
                </div>
                <div className="pkgEditItemZoomCell pkgEditItemZoomNameCell">
                  <input
                    className={`pkgEditInput pkgEditInputReadonly pkgEditItemZoomName${mandatoryHighlight.productName ? " pkgEditMandatoryEmpty" : ""}`}
                    type="text"
                    readOnly
                    value={form.productName}
                    aria-label="商品名"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pkgEditSectionGap" aria-hidden="true" />

          {/* 茶区分・製造日・温湿度（1行） */}
          <div className="pkgEditTeaRow">
            <div className="pkgEditCellLabel pkgEditTeaClassLbl">茶区分</div>
            <div className="pkgEditCellBody pkgEditTeaClassBody">
              <div className="pkgEditTeaRadios" role="radiogroup" aria-label="茶区分">
                <label>
                  <input
                    type="radio"
                    name="pkgOrganic"
                    checked={form.organicClass === "A"}
                    disabled={organicClassLocked}
                    readOnly
                    aria-readonly={organicClassLocked}
                  />
                  有機茶
                </label>
                <label>
                  <input
                    type="radio"
                    name="pkgOrganic"
                    checked={form.organicClass === "B"}
                    disabled={organicClassLocked}
                    readOnly
                    aria-readonly={organicClassLocked}
                  />
                  無農薬茶
                </label>
                <label>
                  <input
                    type="radio"
                    name="pkgOrganic"
                    checked={form.organicClass === "C"}
                    disabled={organicClassLocked}
                    readOnly
                    aria-readonly={organicClassLocked}
                  />
                  一般茶
                </label>
              </div>
            </div>
            <div className="pkgEditCellLabel pkgEditWorkDateLbl">製造日</div>
            <div className="pkgEditCellBody pkgEditWorkDateBody">
              <input
                className="pkgEditWorkDateInput"
                type="date"
                value={form.workDate}
                readOnly={isReadOnly}
                onChange={(e) => setForm((f) => ({ ...f, workDate: e.target.value }))}
                aria-label="製造日"
              />
            </div>
            <div className="pkgEditCellBody pkgEditEnvBody">
              <span className="pkgEditEnvLabel">室内温度・湿度</span>
              <input
                className="pkgEditEnvInput"
                type="text"
                value={form.temperature}
                readOnly={isReadOnly}
                onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))}
                aria-label="温度"
              />
              <span>℃</span>
              <input
                className="pkgEditEnvInput"
                type="text"
                value={form.humidity}
                readOnly={isReadOnly}
                onChange={(e) => setForm((f) => ({ ...f, humidity: e.target.value }))}
                aria-label="湿度"
              />
              <span>％</span>
            </div>
          </div>

          <div className="pkgEditSectionGap" aria-hidden="true" />

          {/* 使用茶明細 */}
          <div className="pkgEditDetailSection">
          <div className="pkgEditDetailGrid" role="table" aria-label="使用茶明細">
            <div className="pkgEditDetailHead">
              <div>使用茶　品名</div>
              <div>ロット</div>
              <div>出庫数量(Kg)</div>
              <div>使用数量(Kg)</div>
              <div>出来上り個数</div>
              <div>使用残(Kg)</div>
            </div>
            <div className="pkgEditPartNameCell">
              <div className="pkgEditPartNameNoRow">
                <input
                  type="text"
                  readOnly
                  className={`pkgEditInput pkgEditInputReadonly pkgEditPartNameNo${mandatoryHighlight.useTeaItemNo ? " pkgEditMandatoryEmpty" : ""}`}
                  value={form.useTeaItemNo1}
                  aria-label="使用茶品名 商品No"
                />
              </div>
              <div className="pkgEditPartNameNameRow">
                <textarea
                  readOnly
                  className={`pkgEditInput pkgEditInputReadonly pkgEditPartNameName${mandatoryHighlight.useTeaItemName ? " pkgEditMandatoryEmpty" : ""}`}
                  value={form.useTeaItemName1}
                  aria-label="使用茶品名 商品名"
                />
              </div>
            </div>
            <div className="pkgEditDetailDataGrid" role="rowgroup" aria-label="使用茶明細データ">
              <PkgEditLotCell
                row={1}
                partLotNo={form.partLotNo1}
                onOpenZoom={setFactory3StocZoomRow}
                onClearRow={handleClearLotRow}
                isReadOnly={isReadOnly}
                useTeaReady={useTeaReady}
              />
              <input
                className="pkgEditInputRight pkgEditDetailDataCell"
                value={form.outQuantity1}
                onChange={(e) => setForm((f) => ({ ...f, outQuantity1: e.target.value }))}
                aria-label="出庫数量1"
              />
              <div className="pkgEditDetailReadonly pkgEditDetailDataCell">{form.useQuantity1}</div>
              <input
                className="pkgEditInputRight pkgEditDetailDataCell"
                type="text"
                inputMode="numeric"
                value={formatCommaInteger(form.completeQuantity)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    completeQuantity: stripCommaDigits(e.target.value)
                  }))
                }
                aria-label="出来上り個数"
              />
              <PkgEditRemQuantityCell
                row={1}
                value={form.remQuantity1}
                disabled={isReadOnly || !form.partLotNo1.trim()}
                hasError={Boolean(remQuantityErrors[1])}
                maxRem={maxRemQuantityFromOut(form.outQuantity1)}
                onChange={(raw) => handleRemQuantityChange(1, raw)}
                onBlur={() => handleRemQuantityBlur(1)}
              />
              <PkgEditLotCell
                row={2}
                partLotNo={form.partLotNo2}
                onOpenZoom={setFactory3StocZoomRow}
                onClearRow={handleClearLotRow}
                isReadOnly={isReadOnly}
                useTeaReady={useTeaReady}
              />
              <input
                className="pkgEditInputRight pkgEditDetailDataCell"
                value={form.outQuantity2}
                onChange={(e) => setForm((f) => ({ ...f, outQuantity2: e.target.value }))}
                aria-label="出庫数量2"
              />
              <div className="pkgEditDetailReadonly pkgEditDetailDataCell">{form.useQuantity2}</div>
              <div className="pkgEditDetailSampleLbl pkgEditDetailDataCell">サンプル数</div>
              <PkgEditRemQuantityCell
                row={2}
                value={form.remQuantity2}
                disabled={isReadOnly || !form.partLotNo2.trim()}
                hasError={Boolean(remQuantityErrors[2])}
                maxRem={maxRemQuantityFromOut(form.outQuantity2)}
                onChange={(raw) => handleRemQuantityChange(2, raw)}
                onBlur={() => handleRemQuantityBlur(2)}
              />
              <PkgEditLotCell
                row={3}
                partLotNo={form.partLotNo3}
                onOpenZoom={setFactory3StocZoomRow}
                onClearRow={handleClearLotRow}
                isReadOnly={isReadOnly}
                useTeaReady={useTeaReady}
              />
              <input
                className="pkgEditInputRight pkgEditDetailDataCell"
                value={form.outQuantity3}
                onChange={(e) => setForm((f) => ({ ...f, outQuantity3: e.target.value }))}
                aria-label="出庫数量3"
              />
              <div className="pkgEditDetailReadonly pkgEditDetailDataCell">{form.useQuantity3}</div>
              <input
                className="pkgEditInputRight pkgEditDetailDataCell"
                value={form.sampleQuantity}
                onChange={(e) => setForm((f) => ({ ...f, sampleQuantity: e.target.value }))}
                aria-label="サンプル数"
              />
              <PkgEditRemQuantityCell
                row={3}
                value={form.remQuantity3}
                disabled={isReadOnly || !form.partLotNo3.trim()}
                hasError={Boolean(remQuantityErrors[3])}
                maxRem={maxRemQuantityFromOut(form.outQuantity3)}
                onChange={(raw) => handleRemQuantityChange(3, raw)}
                onBlur={() => handleRemQuantityBlur(3)}
              />
            </div>
          </div>
            {remQuantityErrorMessage ? (
              <p className="pkgEditRemQuantityError" role="alert">
                {remQuantityErrorMessage}
              </p>
            ) : null}
          </div>

          <div className="pkgEditSectionGap" aria-hidden="true" />

          {/* 賞味期限・清掃記録・時刻（同一エリア・左右同高） */}
          <div className="pkgEditShelfCleaningArea">
            <div className="pkgEditShelfCleaningLeft">
              <div className="pkgEditRow pkgEditShelfRow">
                <div className="pkgEditCellLabel pkgEditShelfBestLbl">
                  賞味期限
                  <br />
                  梱包年月日
                </div>
                <div className="pkgEditCellBody pkgEditShelfDate">
                  <span>{bestBeforeDisplay || "\u00a0"}</span>
                  <span>{packagingDateDisplay || "\u00a0"}</span>
                </div>
                <div className="pkgEditCellLabel pkgEditShelfFailLbl">
                  失敗・不良
                  <br />
                  品数
                </div>
                <div className="pkgEditCellBody pkgEditShelfFail">
                  <input
                    className="pkgEditInput pkgEditInputRight pkgEditShelfFailInput"
                    type="text"
                    value={form.failQuantity}
                    readOnly={isReadOnly}
                    onChange={(e) => setForm((f) => ({ ...f, failQuantity: e.target.value }))}
                  />
                </div>
              </div>
              <div className="pkgEditCleaningSubRow">
                <div className="pkgEditCleaningTitle">清掃記録</div>
                <div className="pkgEditCleanMachineTable" role="table" aria-label="清掃記録・使用機械">
              <div className="pkgEditCleanMachineHead pkgEditCleanMachineHeadSpan">自動包装機</div>
              <div className="pkgEditCleanMachineHead">粉末</div>
              <div className="pkgEditCleanMachineHead">手詰</div>
              <div className="pkgEditCleanMachineCell">
                <span className="pkgEditCleanMachineLbl">HP-500</span>
                <span className="pkgEditCleanMachineLbl">No.1</span>
                <input
                  type="checkbox"
                  checked={form.hp500No1Chk}
                  disabled={isReadOnly}
                  onChange={(e) => setForm((f) => ({ ...f, hp500No1Chk: e.target.checked }))}
                  aria-label="HP-500 No.1"
                />
              </div>
              <div className="pkgEditCleanMachineCell">
                <span className="pkgEditCleanMachineLbl">HP-500</span>
                <span className="pkgEditCleanMachineLbl">No.2</span>
                <input
                  type="checkbox"
                  checked={form.hp500No2Chk}
                  disabled={isReadOnly}
                  onChange={(e) => setForm((f) => ({ ...f, hp500No2Chk: e.target.checked }))}
                  aria-label="HP-500 No.2"
                />
              </div>
              <div className="pkgEditCleanMachineCell">
                <span className="pkgEditCleanMachineLbl">FR2</span>
                <input
                  type="checkbox"
                  checked={form.fr2Chk}
                  disabled={isReadOnly}
                  onChange={(e) => setForm((f) => ({ ...f, fr2Chk: e.target.checked }))}
                  aria-label="FR2"
                />
              </div>
              <div className="pkgEditCleanMachineCell">
                <span className="pkgEditCleanMachineLbl">FPG</span>
                <input
                  type="checkbox"
                  checked={form.fpgChk}
                  disabled={isReadOnly}
                  onChange={(e) => setForm((f) => ({ ...f, fpgChk: e.target.checked }))}
                  aria-label="FPG"
                />
              </div>
              <div className="pkgEditCleanMachineCell">
                <span className="pkgEditCleanMachineLbl">UBA3</span>
                <input
                  type="checkbox"
                  checked={form.ubaChk}
                  disabled={isReadOnly}
                  onChange={(e) => setForm((f) => ({ ...f, ubaChk: e.target.checked }))}
                  aria-label="UBA3"
                />
              </div>
                </div>
              </div>
            </div>
            <div className="pkgEditTimeBlock" aria-label="袋詰・清掃時刻">
              <div className="pkgEditTimeFieldRow">
                <div className="pkgEditCellLabel">袋詰開始時間</div>
                <div className="pkgEditCellBody">
                  <TimeSingleField
                    value={form.packingStart}
                    readOnly={isReadOnly}
                    highlightEmpty={mandatoryHighlight.packingStart}
                    onChange={(packingStart) => setForm((f) => ({ ...f, packingStart }))}
                    ariaLabel="袋詰開始時間"
                  />
                </div>
              </div>
              <div className="pkgEditTimeFieldRow">
                <div className="pkgEditCellLabel">袋詰終了時間</div>
                <div className="pkgEditCellBody">
                  <TimeSingleField
                    value={form.packingEnd}
                    readOnly={isReadOnly}
                    highlightEmpty={mandatoryHighlight.packingEnd}
                    onChange={(packingEnd) => setForm((f) => ({ ...f, packingEnd }))}
                    ariaLabel="袋詰終了時間"
                  />
                </div>
              </div>
              <div className="pkgEditTimeFieldRow">
                <div className="pkgEditCellLabel">作業前清掃時刻</div>
                <div className="pkgEditCellBody">
                  <TimeRangeField
                    value={form.cleaningBefore}
                    readOnly={isReadOnly}
                    highlightStartEmpty={mandatoryHighlight.cleaningBeforeStart}
                    highlightEndEmpty={mandatoryHighlight.cleaningBeforeEnd}
                    onChange={(cleaningBefore) => setForm((f) => ({ ...f, cleaningBefore }))}
                    ariaLabelStart="作業前清掃 開始"
                    ariaLabelEnd="作業前清掃 終了"
                  />
                </div>
              </div>
              <div className="pkgEditTimeFieldRow">
                <div className="pkgEditCellLabel">作業後清掃時刻</div>
                <div className="pkgEditCellBody">
                  <TimeRangeField
                    value={form.cleaningAfter}
                    readOnly={isReadOnly}
                    highlightStartEmpty={mandatoryHighlight.cleaningAfterStart}
                    highlightEndEmpty={mandatoryHighlight.cleaningAfterEnd}
                    onChange={(cleaningAfter) => setForm((f) => ({ ...f, cleaningAfter }))}
                    ariaLabelStart="作業後清掃 開始"
                    ariaLabelEnd="作業後清掃 終了"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="pkgEditSectionNote">・自動包装機使用時</p>

          {/* 昇降機・自動梱包機 */}
          <div className="pkgEditAutoSection">
          <div className="pkgEditAutoPackWrap">
            <table className="pkgEditBaCheckTable pkgEditLiftTable" aria-label="昇降機">
              <colgroup>
                <col className="pkgEditBaCheckColSide" />
                <col className="pkgEditBaCheckColTask" />
                <col className="pkgEditBaCheckColChk" />
                <col className="pkgEditBaCheckColChk" />
              </colgroup>
              <tbody>
                <tr>
                  <th className="pkgEditBaCheckSideTitle" rowSpan={4} scope="rowgroup">
                    昇降機
                  </th>
                  <th className="pkgEditBaCheckHeadTask" scope="col">
                    作業
                  </th>
                  <th className="pkgEditBaCheckHeadCol" scope="col">
                    前
                  </th>
                  <th className="pkgEditBaCheckHeadCol" scope="col">
                    後
                  </th>
                </tr>
                <tr>
                  <td className="pkgEditBaCheckTask">清　　　掃</td>
                  <BeforeAfterCheckboxCells
                    value={form.liftCleaning}
                    readOnly={isReadOnly}
                    onChange={(liftCleaning) => setForm((f) => ({ ...f, liftCleaning }))}
                  />
                </tr>
                <tr>
                  <td className="pkgEditBaCheckTask">空動作確認</td>
                  <BeforeAfterCheckboxCells
                    value={form.liftOperation}
                    readOnly={isReadOnly}
                    onChange={(liftOperation) => setForm((f) => ({ ...f, liftOperation }))}
                  />
                </tr>
                <tr>
                  <td className="pkgEditBaCheckTask">残量物確認</td>
                  <BeforeAfterCheckboxCells
                    value={form.liftRem}
                    readOnly={isReadOnly}
                    onChange={(liftRem) => setForm((f) => ({ ...f, liftRem }))}
                  />
                </tr>
              </tbody>
            </table>
            <div className="pkgEditAutoPackRight">
            <table className="pkgEditBaCheckTable pkgEditAutoPackHeadTable" aria-label="自動梱包機・ヘッダー">
              <colgroup>
                <col className="pkgEditBaCheckColSide" />
                <col />
                <col className="pkgEditBaCheckColWork" />
                <col className="pkgEditBaCheckColChk" />
                <col className="pkgEditBaCheckColChk" />
                <col className="pkgEditBaCheckColSideLbl" />
                <col className="pkgEditBaCheckColChkPair" />
                <col className="pkgEditBaCheckColSideLbl" />
                <col className="pkgEditBaCheckColChkPair" />
              </colgroup>
              <tbody>
                <tr>
                  <th className="pkgEditBaCheckHeadNoteMerged" colSpan={2} scope="col">
                    作業済をチェックする
                  </th>
                  <th className="pkgEditBaCheckHeadWork" scope="col">
                    作業
                  </th>
                  <th className="pkgEditBaCheckHeadCol" colSpan={2} scope="col">
                    前　後
                  </th>
                  <th className="pkgEditBaCheckHeadSide" colSpan={2} scope="col">
                    作業前　後
                  </th>
                  <th className="pkgEditBaCheckHeadSide" colSpan={2} scope="col">
                    作業前　後
                  </th>
                </tr>
              </tbody>
            </table>
            <table className="pkgEditBaCheckTable pkgEditAutoPackTable" aria-label="自動梱包機・空動作・残留物">
              <colgroup>
                <col className="pkgEditBaCheckColSide" />
                <col />
                <col className="pkgEditBaCheckColWork" />
                <col className="pkgEditBaCheckColChk" />
                <col className="pkgEditBaCheckColChk" />
                <col className="pkgEditBaCheckColSideLbl" />
                <col className="pkgEditBaCheckColChkPair" />
                <col className="pkgEditBaCheckColSideLbl" />
                <col className="pkgEditBaCheckColChkPair" />
              </colgroup>
              <tbody>
                {(
                  [
                    ["・フィルターの清掃", "packingFilter"],
                    ["・シール部の汚れ、ビニール付着除去", "packingSeal"],
                    ["・コンベアや内部の汚れ清掃", "packingConveyor"],
                    ["・磁石の金属片を除去", "packingMagnet"]
                  ] as const
                ).map(([label, key], index) => (
                  <tr key={key}>
                    {index === 0 ? (
                      <th className="pkgEditBaCheckSideTitle" rowSpan={4} scope="rowgroup">
                        自動梱包機
                      </th>
                    ) : null}
                    <td className="pkgEditBaCheckTask" colSpan={2}>
                      {label}
                    </td>
                    <BeforeAfterCheckboxCells
                      value={form[key]}
                      readOnly={isReadOnly}
                      onChange={(next) => setForm((f) => ({ ...f, [key]: next }))}
                    />
                    {index === 0 ? (
                      <>
                        <td className="pkgEditBaCheckSideLabelVert" rowSpan={4}>
                          空動作確認
                        </td>
                        <BeforeAfterCheckboxMergedCell
                          value={form.packingOperation}
                          readOnly={isReadOnly}
                          rowSpan={4}
                          onChange={(packingOperation) =>
                            setForm((f) => ({ ...f, packingOperation }))
                          }
                        />
                        <td className="pkgEditBaCheckSideLabelVert" rowSpan={4}>
                          残留物確認
                        </td>
                        <BeforeAfterCheckboxMergedCell
                          value={form.packingRem}
                          readOnly={isReadOnly}
                          rowSpan={4}
                          onChange={(packingRem) => setForm((f) => ({ ...f, packingRem }))}
                        />
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          </div>

          <div className="pkgEditSectionGap" aria-hidden="true" />

          <table className="pkgEditPanelTable" aria-label="パネルの掲示">
            <tbody>
              <tr>
                <th className="pkgEditPanelLabel" scope="row">
                  パネルの掲示
                </th>
                <td className="pkgEditPanelBtn">有機JAS</td>
                <td className="pkgEditPanelBtn">無農薬</td>
              </tr>
            </tbody>
          </table>

          <p className="pkgEditSectionNote">・手詰作業UBA-3使用時</p>
          <div className="pkgEditUbaRow">
            <div className="pkgEditUbaChecks">
              <div className="pkgEditUbaCheckLine">
                <span>　　・仕様道具(茶箱、スコップ、秤)の清掃</span>
                <BeforeAfterChecks
                  value={form.toolCleaning}
                  readOnly={isReadOnly}
                  onChange={(toolCleaning) => setForm((f) => ({ ...f, toolCleaning }))}
                  labelBefore="　　作業前"
                  labelAfter="　　作業後"
                />
              </div>
              <div className="pkgEditUbaCheckLine">
                <span>　　・包装機(UBA-3)内部の清掃</span>
                <BeforeAfterChecks
                  value={form.uba3Cleaning}
                  readOnly={isReadOnly}
                  onChange={(uba3Cleaning) => setForm((f) => ({ ...f, uba3Cleaning }))}
                  labelBefore="　　作業前"
                  labelAfter="　　作業後"
                />
              </div>
            </div>
            <div className="pkgEditCellLabel pkgEditGradeLbl">
              格
              <br />
              付
            </div>
            <div className="pkgEditCellBody pkgEditGradeBody">
              <input
                className="pkgEditInput pkgEditInputRight pkgEditGradeInput"
                type="text"
                value={form.gradeNo}
                readOnly={isReadOnly}
                onChange={(e) => setForm((f) => ({ ...f, gradeNo: e.target.value }))}
                aria-label="格付"
              />
            </div>
          </div>

          {/* 備考・印鑑・重量 */}
          <table className="pkgEditFooterTable" aria-label="備考・印鑑・重量確認">
            <colgroup>
              <col className="pkgEditFooterColRemarks" />
              <col className="pkgEditFooterColMid" />
              <col className="pkgEditFooterColWeight" />
            </colgroup>
            <tbody>
              <tr>
                <td className="pkgEditFooterRemarksCell">
                  <div className="pkgEditFooterRemarksHead">　備考）</div>
                  <div className="pkgEditFooterRemarksHead">　出荷先等</div>
                  <textarea
                    className="pkgEditFooterRemarksInput"
                    value={form.categorysRemarks}
                    readOnly={isReadOnly}
                    onChange={(e) => setForm((f) => ({ ...f, categorysRemarks: e.target.value }))}
                    aria-label="備考・出荷先等"
                  />
                </td>
                <td className="pkgEditFooterMidCell">
                  <table className="pkgEditFooterMidTable" aria-label="印鑑・重量テスト・残留酸素">
                    <colgroup>
                      <col className="pkgEditFooterMidColLbl" />
                      <col className="pkgEditFooterMidColBody" />
                    </colgroup>
                    <tbody>
                      <tr className="pkgEditFooterStampRow">
                        <th className="pkgEditFooterStampLbl" scope="row">
                          印
                          <br />
                          鑑
                          <br />
                          確
                          <br />
                          認
                        </th>
                        <td className="pkgEditFooterStampBox" aria-label="印鑑確認（未実装）" />
                      </tr>
                      <tr>
                        <th className="pkgEditFooterSectionHead" colSpan={2} scope="col">
                          重量テストピース確認
                        </th>
                      </tr>
                      <tr className="pkgEditFooterWeightTestRow">
                        <td className="pkgEditFooterWeightTestCell" colSpan={2}>
                          <div className="pkgEditFooterWeightTestLine">
                            <span>作業前</span>
                            <input
                              type="text"
                              value={form.weightTestBefore}
                              readOnly={isReadOnly}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, weightTestBefore: e.target.value }))
                              }
                              aria-label="重量テストピース 作業前"
                            />
                          </div>
                          <div className="pkgEditFooterWeightTestLine">
                            <span>作業後</span>
                            <input
                              type="text"
                              value={form.weightTestAfter}
                              readOnly={isReadOnly}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, weightTestAfter: e.target.value }))
                              }
                              aria-label="重量テストピース 作業後"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr className="pkgEditFooterOxygenRow">
                        <th className="pkgEditFooterOxygenLbl" scope="row">
                          残留酸
                          <br />
                          素濃度
                        </th>
                        <td className="pkgEditFooterOxygenCell">
                          <div className="pkgEditFooterOxygenLine">
                            <span>AM</span>
                            <input
                              type="text"
                              value={form.residualOxygenAm}
                              readOnly={isReadOnly}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, residualOxygenAm: e.target.value }))
                              }
                              aria-label="残留酸素濃度 AM"
                            />
                            <span>％</span>
                          </div>
                          <div className="pkgEditFooterOxygenLine">
                            <span>PM</span>
                            <input
                              type="text"
                              value={form.residualOxygenPm}
                              readOnly={isReadOnly}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, residualOxygenPm: e.target.value }))
                              }
                              aria-label="残留酸素濃度 PM"
                            />
                            <span>％</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td className="pkgEditFooterWeightCell">
                  <table className="pkgEditFooterWeightTable" aria-label="重量確認">
                    <colgroup>
                      <col className="pkgEditFooterWeightColNo" />
                      <col className="pkgEditFooterWeightColLbl" />
                      <col className="pkgEditFooterWeightColVal" />
                      <col className="pkgEditFooterWeightColUnit" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="pkgEditFooterSectionHead" colSpan={4} scope="col">
                          重量確認
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          [form.weightNo1, form.weightChk1, "weightNo1", "weightChk1"],
                          [form.weightNo2, form.weightChk2, "weightNo2", "weightChk2"],
                          [form.weightNo3, form.weightChk3, "weightNo3", "weightChk3"],
                          [form.weightNo4, form.weightChk4, "weightNo4", "weightChk4"],
                          [form.weightNo5, form.weightChk5, "weightNo5", "weightChk5"]
                        ] as const
                      ).map(([noVal, chkVal, noKey, chkKey], idx) => (
                        <tr key={noKey}>
                          <td className="pkgEditFooterWeightNoCell">
                            <input
                              type="text"
                              className="pkgEditFooterWeightInput"
                              value={noVal}
                              readOnly={isReadOnly}
                              onChange={(e) => setForm((f) => ({ ...f, [noKey]: e.target.value }))}
                              aria-label={`${idx + 1}本目番号`}
                            />
                          </td>
                          <td className="pkgEditFooterWeightLblCell">本目</td>
                          <td className="pkgEditFooterWeightValCell">
                            <input
                              type="text"
                              className="pkgEditFooterWeightInput"
                              value={chkVal}
                              readOnly={isReadOnly}
                              onChange={(e) => setForm((f) => ({ ...f, [chkKey]: e.target.value }))}
                              aria-label={`${idx + 1}本目重量`}
                            />
                          </td>
                          <td className="pkgEditFooterWeightUnitCell">ｇ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={form.itemNo}
        initialName={form.productName}
        filterParams={packageTrItemZoomFilterParams}
        onSelect={(code, name) => {
          applyProductZoomSelection(code, name);
          setItemZoomOpen(false);
        }}
      />

      <Factory3StocZoomModal
        open={factory3StocZoomRow != null}
        stocks={factory3StocCandidates}
        targetRowLabel={factory3StocZoomRow != null ? `ロット行${factory3StocZoomRow}` : undefined}
        onClose={() => setFactory3StocZoomRow(null)}
        onSelect={(stoc) => {
          if (factory3StocZoomRow == null) return;
          setForm((f) => applyFactory3StocToLotRow(f, factory3StocZoomRow, stoc));
          setRemQuantityError(factory3StocZoomRow, null);
          setFactory3StocZoomRow(null);
        }}
      />
    </div>
  );
}

export function PackageLotEditModal({ open, mode, initialForm, onClose, onDeleted }: Props) {
  if (!open) return null;

  return (
    <EditModalOverlay mode={mode} onClose={onClose} className="pkgEditOverlay">
      <PackageLotEditModalContent
        key={`${mode}-${initialForm.productNo || "new"}`}
        mode={mode}
        initialForm={initialForm}
        onClose={onClose}
        onDeleted={onDeleted}
      />
    </EditModalOverlay>
  );
}
