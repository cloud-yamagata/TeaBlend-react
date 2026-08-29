/**
 * ブレンドロット登録 … 一覧・登録・更新・削除 UI。
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { blendLotMasterErrorAtom, masterDataLoadingAtom, masterTrConstantsAtom } from "../repository/masterData";
import { BlendLotListMantineTable } from "./BlendLotListMantineTable";
import { BlendLotPartMantineTable } from "./BlendLotPartMantineTable";
import {
  blendLotRowId,
  buildPartItemFromInput,
  emptyPartInput,
  parsePartItems,
  partItemToApiRecord,
  toNumberText,
  type BlendLotPartInputForm,
  type BlendLotPartItem
} from "./blendLotDisplayUtils";
import {
  blendLotSearchAppliedFiltersAtom,
  blendLotSearchDefaultFilters,
  blendLotSearchExecutedAtom,
  createBlendLotAtom,
  deleteBlendLotsAtom,
  errorMessageAtom,
  filteredBlendLotListAtom,
  loadingAtom,
  type BlendLotSearchFilters,
  updateBlendLotAtom
} from "./store";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { TrItemMasterZoomModal, type TrItemZoomFilterParams } from "../components/TrItemMasterZoomModal";
import { EditModalOverlay } from "../components/modal";
import type { TeBlendLot } from "./types";
import "../MonthlyPlan/styles.css";
import "./blendLotMantineTable.css";

type LotEditorMode = "create" | "update";

type LotEditorForm = {
  productNo: string;
  workDate: string;
  itemNo: string;
  itemName: string;
  unitWeight: string;
  remarks: string;
};

type EditorTouchedState = Partial<Record<keyof LotEditorForm, boolean>> & {
  partLotNo?: boolean;
  partUseQuantity?: boolean;
};

const isBlank = (value: string): boolean => value.trim().length === 0;

const isDigitsOnly = (value: string): boolean => /^\d+$/.test(value.trim());

const toInputDateValue = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const toEditorForm = (lot: TeBlendLot | null): LotEditorForm => {
  if (!lot) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return {
      productNo: "",
      workDate: `${yyyy}-${mm}-${dd}`,
      itemNo: "",
      itemName: "",
      unitWeight: "",
      remarks: ""
    };
  }
  return {
    productNo: lot.productNo == null ? "" : String(lot.productNo),
    workDate: toInputDateValue(lot.workDate),
    itemNo: lot.itemNo == null ? "" : String(lot.itemNo),
    itemName: lot.itemName ?? "",
    unitWeight: lot.unitWeight == null ? "" : String(lot.unitWeight),
    remarks: lot.remarks ?? ""
  };
};

const toApiDateValue = (value: string): string => {
  const normalized = value.trim().replace(/\//g, "-");
  const m = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return normalized;
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

type LotEditorModalProps = {
  mode: LotEditorMode;
  initialLot: TeBlendLot | null;
  onClose: () => void;
};

const LotEditorModal = memo(function LotEditorModal({ mode, initialLot, onClose }: LotEditorModalProps) {
  const createBlendLot = useSetAtom(createBlendLotAtom);
  const updateBlendLot = useSetAtom(updateBlendLotAtom);
  const loading = useAtomValue(loadingAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const [editorPartItems, setEditorPartItems] = useState<BlendLotPartItem[]>(() => parsePartItems(initialLot?.lotPartInfo));
  const [editorForm, setEditorForm] = useState<LotEditorForm>(() => toEditorForm(initialLot));
  const [partInput, setPartInput] = useState<BlendLotPartInputForm>(() => emptyPartInput());
  const [touched, setTouched] = useState<EditorTouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [itemZoomOpen, setItemZoomOpen] = useState(false);

  const trItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(() => ({ systemClass: "2" }), []);

  const canAddPartRow = useMemo(() => {
    if (isBlank(partInput.partLotNo) || isBlank(partInput.useQuantity)) return false;
    const qty = Number(partInput.useQuantity.trim());
    return Number.isFinite(qty);
  }, [partInput]);

  const handleDeletePartRow = useCallback((rowId: string) => {
    setEditorPartItems((prev) => prev.filter((row) => row.id !== rowId));
  }, []);

  const formResetKey = useMemo(() => {
    const baseNo = initialLot?.productNo == null ? "new" : String(initialLot.productNo);
    return `${mode}-${baseNo}`;
  }, [initialLot, mode]);

  useEffect(() => {
    setEditorForm(toEditorForm(initialLot));
    setEditorPartItems(parsePartItems(initialLot?.lotPartInfo));
    setPartInput(emptyPartInput());
    setTouched({});
    setSubmitAttempted(false);
    setSubmitPressed(false);
  }, [initialLot]);

  const updateEditorField = (field: keyof LotEditorForm, value: string) => {
    setEditorForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof EditorTouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldErrors = useMemo(() => {
    const nextErrors: Partial<Record<keyof LotEditorForm | "partLotNo" | "partUseQuantity", string>> = {};

    if (isBlank(editorForm.workDate)) {
      nextErrors.workDate = "作業日は必須です。";
    }
    if (isBlank(editorForm.itemName)) {
      nextErrors.itemName = "仕上品名は必須です。";
    }
    if (isBlank(editorForm.unitWeight)) {
      nextErrors.unitWeight = "梱包重量は必須です。";
    }
    if (!isBlank(editorForm.itemNo) && !isDigitsOnly(editorForm.itemNo)) {
      nextErrors.itemNo = "商品NOは数値で入力してください。";
    }
    if (!isBlank(partInput.useQuantity) && !Number.isFinite(Number(partInput.useQuantity.trim()))) {
      nextErrors.partUseQuantity = "使用数量は数値で入力してください。";
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
      markTouched("partLotNo");
      markTouched("partUseQuantity");
      return;
    }

    const built = buildPartItemFromInput(partInput, `new-${Date.now()}-${editorPartItems.length}`);
    if (built === "missing_required" || built === "invalid_number") {
      markTouched("partLotNo");
      markTouched("partUseQuantity");
      return;
    }

    setEditorPartItems((prev) => [...prev, built]);
    setPartInput(emptyPartInput());
    setTouched((prev) => ({
      ...prev,
      partLotNo: false,
      partUseQuantity: false
    }));
  };

  const handleEditorSubmit = async () => {
    setSubmitPressed(true);
    if (hasValidationError) {
      return;
    }

    const payload = {
      productNo: editorForm.productNo.trim().length > 0 ? Number(editorForm.productNo) : null,
      workDate: toApiDateValue(editorForm.workDate),
      itemNo: editorForm.itemNo.trim().length > 0 ? Number(editorForm.itemNo) : null,
      itemName: editorForm.itemName.trim(),
      unitWeight: editorForm.unitWeight.trim().length > 0 ? Number(editorForm.unitWeight) : null,
      remarks: editorForm.remarks.trim() || null,
      lotPartInfo: editorPartItems.map((item) => partItemToApiRecord(item))
    };

    const result = mode === "create" ? await createBlendLot(payload) : await updateBlendLot(payload);
    if (result) {
      onClose();
    }
  };

  return (
    <EditModalOverlay mode={mode} onClose={onClose}>
      <section className="modalPanel editorPanel" onClick={(event) => event.stopPropagation()}>
        <header className="modalHeader">
          <h2 className="modalTitle">ブレンドロット {mode === "create" ? "登録" : "変更"}</h2>
          <button className="modalCloseButton" type="button" onClick={onClose}>
            閉じる
          </button>
        </header>

        <div className="editorFormGrid" key={formResetKey}>
          <label className="editorField">
            <span>製造NO</span>
            <input value={editorForm.productNo} disabled type="text" />
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
            <span>仕上品名</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={editorForm.itemName}
                onChange={(event) => updateEditorField("itemName", event.target.value)}
                onBlur={() => markTouched("itemName")}
                className={shouldShowError("itemName") ? "inputError" : ""}
                type="text"
                style={{ flex: 1 }}
              />
              <button type="button" className="zoomOpenButton" onClick={() => setItemZoomOpen(true)}>
                仕上茶
              </button>
            </div>
            {shouldShowErrorText("itemName") && <span className="fieldErrorText">{fieldErrors.itemName}</span>}
          </label>
          <label className="editorField">
            <span>梱包重量</span>
            <input
              value={editorForm.unitWeight}
              onChange={(event) => updateEditorField("unitWeight", event.target.value)}
              onBlur={() => markTouched("unitWeight")}
              className={shouldShowError("unitWeight") ? "inputError" : ""}
              type="number"
              step="0.01"
            />
            {shouldShowErrorText("unitWeight") && <span className="fieldErrorText">{fieldErrors.unitWeight}</span>}
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
          <h3>部品情報</h3>
        </div>
        <div className="editorPartsInputGrid">
          <label className="editorPartsInputField">
            <span>部品ロットNo</span>
            <input
              className={`editorPartsInput ${shouldShowError("partLotNo") ? "inputError" : ""}`}
              value={partInput.partLotNo}
              onChange={(event) => setPartInput((prev) => ({ ...prev, partLotNo: event.target.value }))}
              onBlur={() => markTouched("partLotNo")}
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>有機区分</span>
            <TrConstantZoomField
              value={partInput.organicClass}
              onChange={(v) => setPartInput((prev) => ({ ...prev, organicClass: v }))}
              constField="grade"
              title="システム定数（有機区分）"
              constants={trConstants}
              ariaLabel="有機区分"
            />
          </label>
          <label className="editorPartsInputField">
            <span>商品分類NO</span>
            <input
              className="editorPartsInput"
              value={partInput.itemGroupNo}
              onChange={(event) => setPartInput((prev) => ({ ...prev, itemGroupNo: event.target.value }))}
              type="text"
              autoComplete="off"
            />
          </label>
          <label className="editorPartsInputField">
            <span>使用数量</span>
            <input
              className={`editorPartsInput ${shouldShowError("partUseQuantity") ? "inputError" : ""}`}
              value={partInput.useQuantity}
              onChange={(event) => setPartInput((prev) => ({ ...prev, useQuantity: event.target.value }))}
              onBlur={() => markTouched("partUseQuantity")}
              type="number"
              step="0.01"
              autoComplete="off"
            />
          </label>
          <div className="editorPartsInputField editorPartsAddCell">
            <button className="actionButton" type="button" onClick={addPartRow} disabled={!canAddPartRow}>
              追加
            </button>
          </div>
        </div>
        {shouldShowErrorText("partUseQuantity") && (
          <p className="fieldErrorText partsErrorText">{fieldErrors.partUseQuantity}</p>
        )}
        <div className="editorPartsGridWrap">
          <MantineZoomProvider>
            <BlendLotPartMantineTable rows={editorPartItems} onDeleteRow={handleDeletePartRow} />
          </MantineZoomProvider>
        </div>

        <div className="editorFooter">
          {activeErrorCount > 0 && <p className="editorErrorSummary">入力エラー {activeErrorCount} 件</p>}
          <button
            className="actionButton"
            type="button"
            onClick={() => {
              void handleEditorSubmit();
            }}
            disabled={loading || hasValidationError}
          >
            {mode === "create" ? "登録" : "変更"}
          </button>
        </div>
      </section>

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={editorForm.itemNo}
        initialName={editorForm.itemName}
        filterParams={trItemZoomFilterParams}
        onSelect={(code, name) => {
          setEditorForm((prev) => ({ ...prev, itemNo: code, itemName: name }));
        }}
      />
    </EditModalOverlay>
  );
});

export default function BlendLotPage() {
  const blendLotList = useAtomValue(filteredBlendLotListAtom);
  const searchExecuted = useAtomValue(blendLotSearchExecutedAtom);
  const loading = useAtomValue(loadingAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const masterLoading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(blendLotMasterErrorAtom);
  const deleteBlendLots = useSetAtom(deleteBlendLotsAtom);
  const setAppliedFilters = useSetAtom(blendLotSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(blendLotSearchExecutedAtom);
  const [selectedLot, setSelectedLot] = useState<TeBlendLot | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [editorMode, setEditorMode] = useState<LotEditorMode>("create");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialLot, setEditorInitialLot] = useState<TeBlendLot | null>(null);
  const [searchDraft, setSearchDraft] = useState<BlendLotSearchFilters>(() => blendLotSearchDefaultFilters());
  const [searchPanelOpen, setSearchPanelOpen] = useState(true);
  const [itemZoomOpen, setItemZoomOpen] = useState(false);

  const handleSearch = () => {
    setAppliedFilters({ ...searchDraft });
    setSearchExecuted(true);
    setSelectedRowIds(new Set());
  };

  const trItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(() => ({ systemClass: "2" }), []);

  const selectedPartItems = useMemo(() => parsePartItems(selectedLot?.lotPartInfo), [selectedLot]);

  const handleDeleteClick = async () => {
    const selectedRows = blendLotList.filter((row) => selectedRowIds.has(blendLotRowId(row)));
    if (selectedRows.length === 0) {
      return;
    }

    const result = await deleteBlendLots(selectedRows);
    if (result) {
      const deletedKeys = new Set(selectedRows.map((row) => blendLotRowId(row)));
      setSelectedRowIds(new Set());
      if (selectedLot && deletedKeys.has(blendLotRowId(selectedLot))) {
        setSelectedLot(null);
      }
    }
  };

  const selectedRows = useMemo(() => {
    return blendLotList.filter((row) => selectedRowIds.has(blendLotRowId(row)));
  }, [blendLotList, selectedRowIds]);

  const handleOpenDetail = useCallback((row: TeBlendLot) => {
    setSelectedLot(row);
  }, []);

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditorInitialLot(null);
    setIsEditorOpen(true);
  };

  const openUpdateEditor = () => {
    if (selectedRows.length !== 1) {
      return;
    }
    setEditorMode("update");
    setEditorInitialLot(selectedRows[0]);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">ブレンドロット登録</h1>
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
                  <span className="searchFieldLabel">仕上品名</span>
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
                <button className="searchSubmitButton" type="button" onClick={handleSearch}>
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
          <BlendLotListMantineTable
            rows={blendLotList}
            getRowId={blendLotRowId}
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
            onOpenDetail={handleOpenDetail}
            loading={masterLoading}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {selectedLot && (
        <EditModalOverlay mode="view" onClose={() => setSelectedLot(null)}>
          <section className="modalPanel modalPanelPartsDetail" onClick={(event) => event.stopPropagation()}>
            <header className="modalHeader">
              <h2 className="modalTitle">部品情報</h2>
              <button className="modalCloseButton" type="button" onClick={() => setSelectedLot(null)}>
                閉じる
              </button>
            </header>
            <p className="modalCaption">
              製造NO: {toNumberText(selectedLot.productNo)} / 仕上品名: {selectedLot.itemName ?? ""}
            </p>
            <div className="modalTableWrap">
              <MantineZoomProvider>
                <BlendLotPartMantineTable rows={selectedPartItems} />
              </MantineZoomProvider>
            </div>
          </section>
        </EditModalOverlay>
      )}

      {isEditorOpen && (
        <LotEditorModal mode={editorMode} initialLot={editorInitialLot} onClose={closeEditor} />
      )}

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={searchDraft.itemNo}
        initialName={searchDraft.itemName}
        filterParams={trItemZoomFilterParams}
        onSelect={(code, name) => {
          setSearchDraft((p) => ({ ...p, itemNo: code, itemName: name }));
        }}
      />
    </main>
  );
}
