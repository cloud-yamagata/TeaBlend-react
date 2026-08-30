/**
 * ブレンドロット登録 … 一覧・登録・変更・表示 UI。
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  blendLotMasterErrorAtom,
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterTrItemsAtom
} from "../repository/masterData";
import { BlendLotListMantineTable } from "./BlendLotListMantineTable";
import { BlendLotPartMantineTable } from "./BlendLotPartMantineTable";
import { BlendLotPurchaseStocZoomModal } from "./BlendLotPurchaseStocZoomModal";
import {
  buildPartItemFromInput,
  emptyPartInput,
  formatBlendLotPartItemGroupNo,
  formatBlendLotPartOrganicClass,
  parsePartItems,
  partItemToApiRecord,
  type BlendLotPartInputForm,
  type BlendLotPartItem
} from "./blendLotDisplayUtils";
import { buildBlendLotList, findBlendLotByListRowId } from "./buildBlendLotList";
import {
  defaultBlendLotOrganicCheck,
  defaultBlendLotStatusCheck
} from "./blendLotSearchCriteria";
import { filterBlendLotRows } from "./filterBlendLotRows";
import {
  computeBlendLotMandatoryHighlight,
  isBlendLotMandatoryFilled
} from "./blendLotMandatoryFields";
import {
  canConfirmBlendLotStock,
  resolveBlendLotStatusOnSave
} from "./blendLotLotStatus";
import {
  blendLotStocZoomHint,
  blendLotStocZoomTitle,
  collectSelectedProductNos,
  filterFactory3StocByItemGroup,
  purchaseStocToPartInput,
  type BlendLotStocZoomKind,
  BLEND_LOT_FINISHED_ITEM_GROUP_NO,
  BLEND_LOT_PURCHASE_ITEM_GROUP_NO
} from "./filterPurchaseFactory3Stoc";
import {
  isValidBlendLotPartUseQuantityTyping,
  maxBlendLotPartUseQuantityFromStoc,
  normalizeBlendLotPartUseQuantityInput,
  parseBlendLotPartUseQuantityInput,
  validateBlendLotPartUseQuantityAgainstStoc
} from "./blendLotPartUseQuantityInput";
import {
  blendLotListAtom,
  confirmBlendLotStockAtom,
  createBlendLotAtom,
  deleteBlendLotsAtom,
  errorMessageAtom,
  loadingAtom,
  updateBlendLotAtom
} from "./store";
import { TrItemMasterZoomModal, type TrItemZoomFilterParams } from "../components/TrItemMasterZoomModal";
import { EditModalOverlay } from "../components/modal";
import {
  formatPackageLotStatus,
  PACKAGE_LOT_STATUS_ACTIVE,
  isPackageLotStatusConfirmed
} from "../PackageReport/packageLotDisplay";
import { resolveOrganicClassFromTrItem } from "../PackageReport/resolveOrganicClassFromTrItem";
import type { BlendLotAppliedSearchCriteria, BlendLotListRow, TeBlendLot } from "./types";
import "./styles.css";
import "./blendLotEditModal.css";
import "./blendLotMantineTable.css";

type LotEditorMode = "create" | "update" | "view";

const DEFAULT_LOT_STATUS = PACKAGE_LOT_STATUS_ACTIVE;
const DEFAULT_ORGANIC_CLASS = "C";

const ORGANIC_CLASS_OPTIONS = [
  { code: "A", label: "有機茶" },
  { code: "B", label: "無農薬" },
  { code: "C", label: "一般茶" }
] as const;

type LotEditorForm = {
  productNo: string;
  lotStatus: string;
  organicClass: string;
  workDate: string;
  itemNo: string;
  itemName: string;
  unitWeight: string;
  remarks: string;
};

type EditorTouchedState = Partial<Record<keyof LotEditorForm, boolean>> & {
  partProductNo?: boolean;
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
      lotStatus: DEFAULT_LOT_STATUS,
      organicClass: DEFAULT_ORGANIC_CLASS,
      workDate: `${yyyy}-${mm}-${dd}`,
      itemNo: "",
      itemName: "",
      unitWeight: "",
      remarks: ""
    };
  }
  return {
    productNo: lot.productNo == null ? "" : String(lot.productNo),
    lotStatus: (lot.lotStatus ?? DEFAULT_LOT_STATUS).trim(),
    organicClass: (lot.organicClass ?? DEFAULT_ORGANIC_CLASS).trim().toUpperCase(),
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
  onDeleted?: () => void;
};

const LotEditorModal = memo(function LotEditorModal({
  mode,
  initialLot,
  onClose,
  onDeleted
}: LotEditorModalProps) {
  const createBlendLot = useSetAtom(createBlendLotAtom);
  const updateBlendLot = useSetAtom(updateBlendLotAtom);
  const confirmBlendLotStock = useSetAtom(confirmBlendLotStockAtom);
  const deleteBlendLots = useSetAtom(deleteBlendLotsAtom);
  const loading = useAtomValue(loadingAtom);
  const cache = useAtomValue(masterEntityCacheAtom);
  const trItems = useAtomValue(masterTrItemsAtom);
  const isView = mode === "view";
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isReadOnly = isView;
  const [editorPartItems, setEditorPartItems] = useState<BlendLotPartItem[]>(() => parsePartItems(initialLot?.lotPartInfo));
  const [editorForm, setEditorForm] = useState<LotEditorForm>(() => toEditorForm(initialLot));
  const [partInput, setPartInput] = useState<BlendLotPartInputForm>(() => emptyPartInput());
  const [touched, setTouched] = useState<EditorTouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [itemZoomOpen, setItemZoomOpen] = useState(false);
  const [stocZoomKind, setStocZoomKind] = useState<BlendLotStocZoomKind | null>(null);

  const trItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(() => ({ systemClass: "2" }), []);

  const stocZoomExcludeProductNos = useMemo(() => {
    const exclude = collectSelectedProductNos(editorPartItems.map((r) => r.productNo));
    const selectedProductNo = Number(partInput.productNo.trim());
    if (Number.isFinite(selectedProductNo) && partInput.productNo.trim() !== "") {
      return exclude.filter((n) => n !== selectedProductNo);
    }
    return exclude;
  }, [editorPartItems, partInput.productNo]);

  const stocZoomCandidates = useMemo(() => {
    if (stocZoomKind == null) return [];
    const groupNo =
      stocZoomKind === "purchase" ? BLEND_LOT_PURCHASE_ITEM_GROUP_NO : BLEND_LOT_FINISHED_ITEM_GROUP_NO;
    return filterFactory3StocByItemGroup(cache.vi_factory3_stoc, groupNo, stocZoomExcludeProductNos);
  }, [cache.vi_factory3_stoc, stocZoomKind, stocZoomExcludeProductNos]);

  const maxPartUseQuantity = useMemo(
    () => maxBlendLotPartUseQuantityFromStoc(partInput.stocQuantity),
    [partInput.stocQuantity]
  );

  const canAddPartRow = useMemo(() => {
    if (isReadOnly) return false;
    if (isBlank(partInput.productNo) || isBlank(partInput.itemNo) || isBlank(partInput.useQuantity)) {
      return false;
    }
    const qty = parseBlendLotPartUseQuantityInput(partInput.useQuantity);
    if (qty == null || qty <= 0) return false;
    if (maxPartUseQuantity != null && qty > maxPartUseQuantity) return false;
    return true;
  }, [isReadOnly, maxPartUseQuantity, partInput]);

  const handleDeletePartRow = useCallback(
    (rowId: string) => {
      if (isReadOnly) return;
      setEditorPartItems((prev) => prev.filter((row) => row.id !== rowId));
    },
    [isReadOnly]
  );

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
    if (isReadOnly) return;
    setEditorForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof EditorTouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldErrors = useMemo(() => {
    if (isReadOnly) {
      return {} as Partial<Record<keyof LotEditorForm | "partProductNo" | "partUseQuantity", string>>;
    }

    const nextErrors: Partial<Record<keyof LotEditorForm | "partProductNo" | "partUseQuantity", string>> = {};

    if (isBlank(editorForm.workDate)) {
      nextErrors.workDate = "製造日は必須です。";
    }
    if (isBlank(editorForm.itemNo)) {
      nextErrors.itemNo = "仕上茶NOは必須です。";
    }
    if (isBlank(editorForm.itemName)) {
      nextErrors.itemName = "仕上茶名は必須です。";
    }
    if (isBlank(editorForm.unitWeight)) {
      nextErrors.unitWeight = "梱包重量は必須です。";
    }
    if (!isBlank(editorForm.itemNo) && !isDigitsOnly(editorForm.itemNo)) {
      nextErrors.itemNo = "商品NOは数値で入力してください。";
    }
    if (isBlank(partInput.productNo) && !isBlank(partInput.useQuantity)) {
      nextErrors.partProductNo = "仕入品在庫または仕上品在庫ZOOMで部品を選択してください。";
    }
    if (!isBlank(partInput.useQuantity)) {
      if (!Number.isFinite(Number(partInput.useQuantity.trim()))) {
        nextErrors.partUseQuantity = "使用数量は数値で入力してください。";
      } else {
        const stockError = validateBlendLotPartUseQuantityAgainstStoc(
          partInput.useQuantity,
          partInput.stocQuantity
        );
        if (stockError) {
          nextErrors.partUseQuantity = stockError;
        }
      }
    }

    return nextErrors;
  }, [editorForm, isReadOnly, partInput]);

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
    if (isReadOnly || !canAddPartRow) {
      markTouched("partProductNo");
      markTouched("partUseQuantity");
      return;
    }

    const normalizedInput: BlendLotPartInputForm = {
      ...partInput,
      useQuantity: normalizeBlendLotPartUseQuantityInput(partInput.useQuantity, maxPartUseQuantity)
    };
    const built = buildPartItemFromInput(normalizedInput, `new-${Date.now()}-${editorPartItems.length}`);
    if (built === "missing_required" || built === "invalid_number") {
      markTouched("partProductNo");
      markTouched("partUseQuantity");
      return;
    }

    setEditorPartItems((prev) => [...prev, built]);
    setPartInput(emptyPartInput());
    setTouched((prev) => ({
      ...prev,
      partProductNo: false,
      partUseQuantity: false
    }));
  };

  const handleEditorSubmit = async () => {
    if (isReadOnly) return;
    setSubmitPressed(true);
    if (hasValidationError) {
      return;
    }

    const payload = {
      productNo: editorForm.productNo.trim().length > 0 ? Number(editorForm.productNo) : null,
      lotStatus: resolveBlendLotStatusOnSave(editorPartItems.length, editorForm.lotStatus),
      organicClass: editorForm.organicClass.trim() || DEFAULT_ORGANIC_CLASS,
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

  const handleDelete = async () => {
    if (!isUpdate || !initialLot) return;
    const productNoText = initialLot.productNo == null ? "" : String(initialLot.productNo);
    if (!window.confirm(`製造NO ${productNoText} を削除します。よろしいですか？`)) {
      return;
    }
    const ok = await deleteBlendLots([initialLot]);
    if (ok) {
      onDeleted?.();
      onClose();
    }
  };

  const handleConfirmStock = async () => {
    if (!isUpdate || !initialLot) return;
    if (!window.confirm("在庫を確定します。よろしいですか？")) {
      return;
    }

    const payload = {
      productNo: initialLot.productNo,
      lotStatus: resolveBlendLotStatusOnSave(editorPartItems.length, editorForm.lotStatus),
      organicClass: editorForm.organicClass.trim() || DEFAULT_ORGANIC_CLASS,
      workDate: toApiDateValue(editorForm.workDate),
      itemNo: editorForm.itemNo.trim().length > 0 ? Number(editorForm.itemNo) : null,
      itemName: editorForm.itemName.trim(),
      unitWeight: editorForm.unitWeight.trim().length > 0 ? Number(editorForm.unitWeight) : null,
      remarks: editorForm.remarks.trim() || null,
      lotPartInfo: editorPartItems.map((item) => partItemToApiRecord(item))
    };

    const updated = await updateBlendLot(payload);
    if (!updated) return;

    const result = await confirmBlendLotStock(updated);
    if (result) {
      onClose();
    }
  };

  const mandatoryHighlight = useMemo(
    () =>
      isReadOnly
        ? { itemNo: false, itemName: false, unitWeight: false }
        : computeBlendLotMandatoryHighlight(editorForm),
    [editorForm, isReadOnly]
  );

  const canRegister = isCreate && isBlendLotMandatoryFilled(editorForm) && !loading;
  const isLotConfirmed = isPackageLotStatusConfirmed(editorForm.lotStatus);
  const canUpdate = isUpdate && !isLotConfirmed && !loading;
  const canConfirmStock = isUpdate && canConfirmBlendLotStock(editorForm.lotStatus) && !loading;
  const displayLotStatus = resolveBlendLotStatusOnSave(editorPartItems.length, editorForm.lotStatus);

  return (
    <EditModalOverlay mode={mode} onClose={onClose} className="pkgEditOverlay blendLotEditOverlay">
      <div className="pkgEditWindow" onClick={(event) => event.stopPropagation()}>
        <div className="pkgEditWindowHeader">
          <h1 className="pkgEditWindowTitle">ブレンドロット登録画面</h1>
          <button type="button" className="pkgEditCloseBtn" onClick={onClose}>
            閉じる
          </button>
        </div>
        <section className="pkgEditPanel" aria-labelledby="blend-lot-edit-title">
          <div className="pkgEditForm" key={formResetKey}>
            <header className="pkgEditToolbar">
              <h2 id="blend-lot-edit-title" className="pkgEditToolbarTitle">
                ブレンドロット
              </h2>
              <button
                type="button"
                disabled={!canRegister || loading}
                title={canRegister ? "登録" : "仕上茶NO・仕上茶名・製造日・梱包重量を入力してください"}
                onClick={() => {
                  void handleEditorSubmit();
                }}
              >
                登録
              </button>
              <button
                type="button"
                disabled={!canUpdate}
                title={isLotConfirmed ? "ロット状態が確定のため変更できません" : "変更"}
                onClick={() => {
                  void handleEditorSubmit();
                }}
              >
                変更
              </button>
              <button
                type="button"
                disabled={!isUpdate || loading}
                title="削除"
                onClick={() => {
                  void handleDelete();
                }}
              >
                削除
              </button>
              <button
                type="button"
                disabled={!canConfirmStock}
                title={
                  canConfirmStock
                    ? "在庫確定"
                    : "ロット状態が完了の変更保存後に利用できます"
                }
                onClick={() => {
                  void handleConfirmStock();
                }}
              >
                在庫確定
              </button>
            </header>

            {activeErrorCount > 0 && submitPressed ? (
              <p className="pkgEditRemQuantityError" role="alert">
                入力エラー {activeErrorCount} 件
              </p>
            ) : null}

            <div className="pkgEditRow pkgEditHeaderRow blendLotEditHeaderRow">
              <div className="pkgEditCellLabel pkgEditHeaderProductNo">製造No</div>
              <div className="pkgEditCellBody pkgEditHeaderProductNoVal">
                <div className="pkgEditProductNoText">
                  <span>{editorForm.organicClass || " "}</span>
                  <span>-</span>
                  <span>{editorForm.productNo || " "}</span>
                </div>
              </div>
              <button
                type="button"
                className="pkgEditZoomButton pkgEditHeaderItemZoomBtn"
                disabled={isReadOnly}
                onClick={() => setItemZoomOpen(true)}
              >
                仕上茶
              </button>
              <div className="pkgEditCellBody pkgEditHeaderItemZoom">
                <div className="pkgEditItemZoomFields">
                  <div className="pkgEditItemZoomCell pkgEditItemZoomNoCell">
                    <input
                      className={`pkgEditInput pkgEditInputReadonly pkgEditItemZoomNo${mandatoryHighlight.itemNo ? " pkgEditMandatoryEmpty" : ""}`}
                      type="text"
                      readOnly
                      value={editorForm.itemNo}
                      aria-label="仕上茶NO"
                    />
                  </div>
                  <div className="pkgEditItemZoomCell pkgEditItemZoomNameCell">
                    <input
                      className={`pkgEditInput pkgEditInputReadonly pkgEditItemZoomName${mandatoryHighlight.itemName ? " pkgEditMandatoryEmpty" : ""}`}
                      type="text"
                      readOnly
                      value={editorForm.itemName}
                      aria-label="仕上茶名"
                    />
                  </div>
                </div>
              </div>
              <div className="pkgEditCellLabel blendLotEditHeaderTeaLbl">茶区分</div>
              <div className="pkgEditCellBody blendLotEditHeaderTeaBody">
                <div className="pkgEditTeaRadios" role="radiogroup" aria-label="茶区分">
                  {ORGANIC_CLASS_OPTIONS.map((option) => (
                    <label key={option.code}>
                      <input
                        type="radio"
                        name="blendLotOrganic"
                        checked={editorForm.organicClass === option.code}
                        disabled
                        readOnly
                        aria-readonly
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pkgEditSectionGap" aria-hidden="true" />

            <div className="pkgEditRow blendLotEditWorkDateRow">
              <div className="pkgEditCellLabel pkgEditWorkDateLbl">製造日</div>
              <div className="pkgEditCellBody pkgEditWorkDateBody">
                <input
                  className="pkgEditWorkDateInput"
                  type="date"
                  value={editorForm.workDate}
                  readOnly={isReadOnly}
                  onChange={(event) => updateEditorField("workDate", event.target.value)}
                  aria-label="製造日"
                />
              </div>
              <div className="pkgEditCellLabel blendLotEditWorkDateStatusLbl">ロット状態</div>
              <div className="pkgEditCellBody blendLotEditWorkDateStatusBody">
                <input
                  className="pkgEditInput pkgEditInputReadonly"
                  type="text"
                  readOnly
                  value={formatPackageLotStatus(displayLotStatus)}
                  aria-label="ロット状態"
                />
              </div>
              <div className="pkgEditCellLabel blendLotEditWorkDateWeightLbl">梱包重量(kg)</div>
              <div className="pkgEditCellBody blendLotEditWorkDateWeightBody">
                <input
                  className={`pkgEditInput pkgEditInputRight${mandatoryHighlight.unitWeight ? " pkgEditMandatoryEmpty" : ""}`}
                  type="number"
                  step="0.01"
                  value={editorForm.unitWeight}
                  readOnly={isReadOnly}
                  onChange={(event) => updateEditorField("unitWeight", event.target.value)}
                  onBlur={() => markTouched("unitWeight")}
                  aria-label="梱包重量"
                />
              </div>
              <div className="pkgEditCellLabel blendLotEditWorkDateRemarksLbl">摘要</div>
              <div className="pkgEditCellBody blendLotEditWorkDateRemarksBody">
                <input
                  className="pkgEditInput"
                  type="text"
                  value={editorForm.remarks}
                  readOnly={isReadOnly}
                  onChange={(event) => updateEditorField("remarks", event.target.value)}
                  aria-label="摘要"
                />
              </div>
            </div>

            <div className="pkgEditSectionGap" aria-hidden="true" />

            <div className="blendLotEditPartsSection">
              <header className="pkgEditToolbar blendLotEditPartsToolbar">
                <h3 className="pkgEditToolbarTitle">使用部品情報</h3>
              </header>
              {!isReadOnly ? (
                <>
                  <div className="pkgEditRow blendLotEditPartInputRow">
                    <div className="pkgEditCellLabel blendLotEditPartLbl">仕上茶NO</div>
                    <div className="pkgEditCellBody blendLotEditPartNoBody">
                      <input
                        className="pkgEditInput pkgEditInputReadonly"
                        value={partInput.itemNo}
                        readOnly
                        tabIndex={-1}
                        type="text"
                        aria-label="仕上茶NO"
                      />
                    </div>
                    <div className="pkgEditCellLabel blendLotEditPartLbl">有機区分</div>
                    <div className="pkgEditCellBody blendLotEditPartOrganicBody">
                      <input
                        className="pkgEditInput pkgEditInputReadonly"
                        value={formatBlendLotPartOrganicClass(partInput.organicClass || null)}
                        readOnly
                        tabIndex={-1}
                        type="text"
                        aria-label="有機区分"
                      />
                    </div>
                    <div className="pkgEditCellLabel blendLotEditPartLbl">商品分類</div>
                    <div className="pkgEditCellBody blendLotEditPartGroupBody">
                      <input
                        className="pkgEditInput pkgEditInputReadonly"
                        value={formatBlendLotPartItemGroupNo(partInput.itemGroupNo || null, cache.tr_item_group)}
                        readOnly
                        tabIndex={-1}
                        type="text"
                        aria-label="商品分類"
                      />
                    </div>
                    <div className="pkgEditCellLabel blendLotEditPartLbl">仕上茶名</div>
                    <div className="pkgEditCellBody blendLotEditPartNameBody">
                      <input
                        className="pkgEditInput pkgEditInputReadonly"
                        value={partInput.itemName}
                        readOnly
                        tabIndex={-1}
                        type="text"
                        aria-label="仕上茶名"
                      />
                    </div>
                  </div>

                  <div className="pkgEditSectionGap" aria-hidden="true" />

                  <div className="pkgEditRow blendLotEditPartInputRow">
                    <div className="pkgEditCellLabel blendLotEditPartLbl">製造No</div>
                    <div className="pkgEditCellBody blendLotEditPartNoBody">
                      <input
                        className={`pkgEditInput pkgEditInputReadonly${shouldShowError("partProductNo") ? " blendLotEditInputError" : ""}`}
                        value={partInput.productNo}
                        readOnly
                        tabIndex={-1}
                        type="text"
                        aria-label="製造No"
                      />
                    </div>
                    <div className="pkgEditCellLabel blendLotEditPartLbl">在庫数量</div>
                    <div className="pkgEditCellBody blendLotEditPartQtyBody">
                      <input
                        className="pkgEditInput pkgEditInputReadonly pkgEditInputRight"
                        value={partInput.stocQuantity}
                        readOnly
                        tabIndex={-1}
                        type="text"
                        aria-label="在庫数量"
                      />
                    </div>
                    <div className="pkgEditCellLabel blendLotEditPartLbl blendLotEditPartUseQtyLbl">使用数量</div>
                    <div className="pkgEditCellBody blendLotEditPartQtyBody">
                      <input
                        className={`pkgEditInput pkgEditInputRight${shouldShowError("partUseQuantity") ? " blendLotEditInputError" : ""}`}
                        value={partInput.useQuantity}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (!isValidBlendLotPartUseQuantityTyping(raw)) return;
                          setPartInput((prev) => ({ ...prev, useQuantity: raw }));
                        }}
                        onBlur={() => {
                          markTouched("partUseQuantity");
                          setPartInput((prev) => ({
                            ...prev,
                            useQuantity: normalizeBlendLotPartUseQuantityInput(
                              prev.useQuantity,
                              maxPartUseQuantity
                            )
                          }));
                        }}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        disabled={isBlank(partInput.productNo)}
                        placeholder={
                          isBlank(partInput.productNo)
                            ? "先にZOOM選択"
                            : maxPartUseQuantity != null
                              ? `上限 ${maxPartUseQuantity}`
                              : ""
                        }
                        aria-label="使用数量"
                      />
                    </div>
                    <div className="pkgEditCellBody blendLotEditPartActionsBody">
                      <div className="blendLotEditPartActions">
                        <button
                          type="button"
                          className="pkgEditZoomButton blendLotEditPartZoomBtn"
                          onClick={() => setStocZoomKind("purchase")}
                          title="仕入品在庫ZOOM（商品分類=4）"
                        >
                          仕入品在庫
                        </button>
                        <button
                          type="button"
                          className="pkgEditZoomButton blendLotEditPartZoomBtn"
                          onClick={() => setStocZoomKind("finished")}
                          title="仕上品在庫ZOOM（商品分類=3）"
                        >
                          仕上品在庫
                        </button>
                        <button type="button" disabled={!canAddPartRow} onClick={addPartRow}>
                          追加
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPartInput(emptyPartInput());
                            setTouched((prev) => ({ ...prev, partProductNo: false, partUseQuantity: false }));
                          }}
                          disabled={isBlank(partInput.productNo) && isBlank(partInput.useQuantity)}
                        >
                          クリア
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pkgEditSectionGap" aria-hidden="true" />
                </>
              ) : null}
              <div className="editorPartsGridWrap">
                <MantineZoomProvider>
                  <BlendLotPartMantineTable
                    rows={editorPartItems}
                    variant={isReadOnly ? "detail" : "editor"}
                    onDeleteRow={isReadOnly ? undefined : handleDeletePartRow}
                  />
                </MantineZoomProvider>
              </div>
            </div>
          </div>
        </section>
      </div>

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={editorForm.itemNo}
        initialName={editorForm.itemName}
        filterParams={trItemZoomFilterParams}
        onSelect={(code, name) => {
          const organicClass = resolveOrganicClassFromTrItem(trItems, code) || DEFAULT_ORGANIC_CLASS;
          setEditorForm((prev) => ({
            ...prev,
            itemNo: code,
            itemName: name,
            organicClass
          }));
          setItemZoomOpen(false);
        }}
      />

      {!isReadOnly ? (
        <BlendLotPurchaseStocZoomModal
          open={stocZoomKind != null}
          rows={stocZoomCandidates}
          title={stocZoomKind ? blendLotStocZoomTitle(stocZoomKind) : ""}
          hint={stocZoomKind ? blendLotStocZoomHint(stocZoomKind) : ""}
          onClose={() => setStocZoomKind(null)}
          onSelect={(row) => {
            setPartInput(purchaseStocToPartInput(row));
            setTouched((prev) => ({ ...prev, partProductNo: false, partUseQuantity: false }));
          }}
        />
      ) : null}
    </EditModalOverlay>
  );
});

export default function BlendLotPage() {
  const sourceLots = useAtomValue(blendLotListAtom);
  const loading = useAtomValue(loadingAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const masterLoading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(blendLotMasterErrorAtom);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<LotEditorMode>("create");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialLot, setEditorInitialLot] = useState<TeBlendLot | null>(null);
  const [workDate, setWorkDate] = useState("");
  const [searchItemNo, setSearchItemNo] = useState("");
  const [searchItemName, setSearchItemName] = useState("");
  const [itemZoomOpen, setItemZoomOpen] = useState(false);
  const [lotStatusCheck, setLotStatusCheck] = useState(defaultBlendLotStatusCheck);
  const [organicCheck, setOrganicCheck] = useState(defaultBlendLotOrganicCheck);
  const [appliedCriteria, setAppliedCriteria] = useState<BlendLotAppliedSearchCriteria | null>(null);

  const allRows = useMemo(() => buildBlendLotList(sourceLots), [sourceLots]);

  const rows = useMemo(() => {
    if (!appliedCriteria) return [];
    return filterBlendLotRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;

  const handleSearch = () => {
    const itemNo = searchItemNo.trim() ? Number(searchItemNo.trim()) : null;
    setAppliedCriteria({
      lotStatusCheck: { ...lotStatusCheck },
      organicCheck: { ...organicCheck },
      workDate: workDate.trim() || null,
      itemNo: itemNo != null && Number.isFinite(itemNo) ? itemNo : null,
      itemNameQuery: searchItemName.trim()
    });
    setSelectedRowId(null);
  };

  const trItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(() => ({ systemClass: "2" }), []);

  const selectedLot = useMemo(
    (): TeBlendLot | null => findBlendLotByListRowId(sourceLots, selectedRowId),
    [sourceLots, selectedRowId]
  );

  const hasSelection = selectedLot != null;
  const isSelectedLotConfirmed =
    selectedLot != null && isPackageLotStatusConfirmed(selectedLot.lotStatus ?? "");
  const canOpenUpdate = hasSelection && !isSelectedLotConfirmed;

  const handleRowSelect = useCallback((row: BlendLotListRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditorInitialLot(null);
    setIsEditorOpen(true);
  };

  const openUpdateEditor = () => {
    if (!selectedLot) return;
    setEditorMode("update");
    setEditorInitialLot(selectedLot);
    setIsEditorOpen(true);
  };

  const openViewEditor = () => {
    if (!selectedLot) return;
    setEditorMode("view");
    setEditorInitialLot(selectedLot);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };

  return (
    <main className="page blendLotPage">
      <header className="toolbar">
        <h1 className="title">ブレンドロット登録</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {errorMessage ? <p className="error">{errorMessage}</p> : null}
      {masterLoading ? <p className="blendLotHint">マスタ読込中…</p> : null}
      {loading ? <p className="blendLotHint">処理中…</p> : null}
      {!masterLoading && !masterError ? (
        <p className="blendLotHint">
          {searchExecuted
            ? `一覧 ${rows.length} 件（マスタ ${allRows.length} 件）`
            : "「検索」を押すと一覧を表示します（条件は任意）"}
        </p>
      ) : null}

      <nav className="blendLotMenuRow" aria-label="登録メニュー">
        <button
          type="button"
          className="blendLotMenuItem"
          onClick={openCreateEditor}
          title="ブレンドロットを新規登録"
        >
          登録
        </button>
        <button
          type="button"
          className="blendLotMenuItem"
          disabled={!canOpenUpdate}
          onClick={openUpdateEditor}
          title={
            !hasSelection
              ? "行を1件選択してください"
              : isSelectedLotConfirmed
                ? "ロット状態が確定のため変更できません"
                : "選択行を変更モードで開く"
          }
        >
          変更
        </button>
        <button
          type="button"
          className="blendLotMenuItem"
          disabled={!hasSelection}
          onClick={openViewEditor}
          title={hasSelection ? "選択行を表示モードで開く" : "行を1件選択してください"}
        >
          表示
        </button>
      </nav>

      <section className="blendLotSearchRow" aria-label="検索条件">
        <fieldset className="factory2GroupBox blendLotSearchGroupBox">
          <legend>状態</legend>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={lotStatusCheck.active}
              onChange={(e) => setLotStatusCheck((p) => ({ ...p, active: e.target.checked }))}
            />
            仕掛
          </label>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={lotStatusCheck.complete}
              onChange={(e) => setLotStatusCheck((p) => ({ ...p, complete: e.target.checked }))}
            />
            完了
          </label>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={lotStatusCheck.confirm}
              onChange={(e) => setLotStatusCheck((p) => ({ ...p, confirm: e.target.checked }))}
            />
            確定
          </label>
        </fieldset>
        <fieldset className="factory2GroupBox blendLotSearchGroupBox">
          <legend>有機</legend>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.organic}
              onChange={(e) => setOrganicCheck((p) => ({ ...p, organic: e.target.checked }))}
            />
            有機茶
          </label>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.pesticideFree}
              onChange={(e) => setOrganicCheck((p) => ({ ...p, pesticideFree: e.target.checked }))}
            />
            無農薬
          </label>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.general}
              onChange={(e) => setOrganicCheck((p) => ({ ...p, general: e.target.checked }))}
            />
            一般茶
          </label>
        </fieldset>
        <label className="searchField blendLotSearchDateField">
          <span className="searchFieldLabel">製造日</span>
          <input
            className="searchControl"
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
          />
        </label>
        <div className="searchFieldItemZoomGroup">
          <label className="searchField">
            <span className="searchFieldLabel">商品NO</span>
            <input
              className="searchControl searchControlItemNo"
              type="text"
              inputMode="numeric"
              value={searchItemNo}
              onChange={(e) => setSearchItemNo(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="searchField">
            <span className="searchFieldLabel">商品名</span>
            <input
              className="searchControl searchControlItemName"
              type="text"
              value={searchItemName}
              onChange={(e) => setSearchItemName(e.target.value)}
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
          <button
            type="button"
            className="searchSubmitButton"
            onClick={handleSearch}
            title="検索条件で一覧を表示（条件なしの場合は全件）"
          >
            検索
          </button>
        </div>
      </section>

      <section className="tableWrap">
        <MantineZoomProvider>
          <BlendLotListMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            loading={masterLoading}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {isEditorOpen && (
        <LotEditorModal
          mode={editorMode}
          initialLot={editorInitialLot}
          onClose={closeEditor}
          onDeleted={() => setSelectedRowId(null)}
        />
      )}

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={searchItemNo}
        initialName={searchItemName}
        filterParams={trItemZoomFilterParams}
        onSelect={(code, name) => {
          setSearchItemNo(code.trim());
          setSearchItemName(name.trim());
          setItemZoomOpen(false);
        }}
        onClear={() => {
          setSearchItemNo("");
          setSearchItemName("");
          setItemZoomOpen(false);
        }}
      />
    </main>
  );
}
