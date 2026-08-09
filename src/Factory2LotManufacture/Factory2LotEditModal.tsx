/**
 * 第2工場製造ロット登録画面（EditWindow.xaml 左ペイン）
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Factory2LotEditFormData, Factory2LotEditMode, Factory2LotEditPartRow } from "./factory2LotEditTypes";
import { Factory2LotEditPartsTable } from "./Factory2LotEditPartsTable";
import { isFactory2LotStatusConfirmed, isFactory2OrganicTea, normalizeProcessTypeCode } from "./factory2LotDisplay";
import type { Factory2ProcessFilter } from "./types";
import { EditModalOverlay } from "../components/modal";
import "../MonthlyPlan/styles.css";
import "./factory2LotEditModal.css";
import type { MasterEntityCache, ViFactory2Stock } from "../domain/masterTableEntityModels";
import { useBusyTask } from "../ui/useBusyTask";
import {
  collectFactory2LotCreatePayload,
  collectFactory2LotUpdatePayload
} from "./collectFactory2LotEditPayload";
import { Factory2MakeYearSpinner } from "./Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "./factory2MakeYear";
import {
  createFactory2LotAtom,
  deleteFactory2LotAtom,
  factory2LotMutationErrorAtom,
  updateFactory2LotAtom
} from "./store";
import { Factory2StockZoomModal } from "../components/Factory2StockZoomModal";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  previewFactory2GradeReportViaHelper,
  previewFactory2ReportViaHelper
} from "./factory2ReportHelperApi";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const PROCESS_HEADER_OPTIONS: { code: Factory2ProcessFilter; label: string }[] = [
  { code: "02", label: "02:荒茶配合" },
  { code: "03", label: "03:仕上" },
  { code: "04", label: "04:火入" },
  { code: "05", label: "05:仕上配合" }
];

type OrganicClassCode = "A" | "B" | "C";

const ORGANIC_CLASS_OPTIONS: { code: OrganicClassCode; label: string }[] = [
  { code: "A", label: "有機茶" },
  { code: "B", label: "無農薬茶" },
  { code: "C", label: "一般茶" }
];

const toOrganicClassCode = (code: string): OrganicClassCode => {
  const c = code.trim().toUpperCase();
  if (c === "A" || c === "B" || c === "C") return c;
  return "C";
};

/** 使用量（kg）… 小数1桁まで */
const formatUseQuantityValue = (n: number): string => {
  return (Math.round(n * 10) / 10).toFixed(1);
};

const parseUseQuantityInput = (text: string): number | null => {
  const t = text.trim().replace(/,/g, "");
  if (!t || t === ".") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const normalizeUseQuantityInput = (text: string, maxStock: number | null): string => {
  let n = parseUseQuantityInput(text);
  if (n == null) return "";
  n = Math.max(0, n);
  if (maxStock != null && maxStock > 0) n = Math.min(n, maxStock);
  return formatUseQuantityValue(n);
};

const useQuantityFromStock = (stock: number | null | undefined): string => {
  if (stock == null || stock <= 0) return "";
  return formatUseQuantityValue(stock);
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

type Props = {
  open: boolean;
  mode: Factory2LotEditMode;
  form: Factory2LotEditFormData;
  factory2Stocks: ViFactory2Stock[];
  masterCache: MasterEntityCache;
  onClose: () => void;
  onDeleted?: () => void;
};

function LabelCell({
  children,
  width,
  className,
  style
}: {
  children: ReactNode;
  width: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`f2EditCellLabel${className ? ` ${className}` : ""}`} style={{ width, ...style }}>
      {children}
    </div>
  );
}

function ValueCell({ children, width, style }: { children: ReactNode; width: number | string; style?: CSSProperties }) {
  return (
    <div className="f2EditCellValue" style={{ width, ...style }}>
      {children}
    </div>
  );
}

function CheckPanel({
  title,
  items,
  readOnly
}: {
  title: string;
  items: { label: string; checked: boolean }[];
  readOnly?: boolean;
}) {
  return (
    <div className="f2EditCheckPanel" style={{ width: items.length * 50 }}>
      <div className="f2EditCheckPanelTitle">{title}</div>
      <div className="f2EditCheckPanelBody">
        {items.map((item) => (
          <div key={item.label} className="f2EditCheckCell">
            <span>{item.label}</span>
            <input
              type="checkbox"
              defaultChecked={item.checked}
              readOnly={readOnly}
              aria-label={item.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Factory2LotEditModalContent({
  mode,
  form,
  factory2Stocks,
  masterCache,
  onClose,
  onDeleted
}: Omit<Props, "open">) {
  const panelRef = useRef<HTMLElement>(null);
  const runBusy = useBusyTask();
  const createLot = useSetAtom(createFactory2LotAtom);
  const updateLot = useSetAtom(updateFactory2LotAtom);
  const deleteLot = useSetAtom(deleteFactory2LotAtom);
  const mutationError = useAtomValue(factory2LotMutationErrorAtom);
  const setMutationError = useSetAtom(factory2LotMutationErrorAtom);
  const [partItems, setPartItems] = useState<Factory2LotEditPartRow[]>(() => [...form.partRows]);
  const [stockEntryError, setStockEntryError] = useState<string>("");
  const [stockZoomOpen, setStockZoomOpen] = useState(false);
  const [localError, setLocalError] = useState<string>("");
  const [organicClassCode, setOrganicClassCode] = useState<OrganicClassCode>(() =>
    toOrganicClassCode(form.organicClassCode)
  );
  const [makeYear, setMakeYear] = useState(() => {
    const normalized = normalizeMakeYearFromForm(form.makeYear);
    return normalized || getDefaultMakeYear();
  });

  useEffect(() => {
    setMutationError(null);
    setLocalError("");
  }, [setMutationError]);

  useEffect(() => {
    setOrganicClassCode(toOrganicClassCode(form.organicClassCode));
    const normalizedYear = normalizeMakeYearFromForm(form.makeYear);
    setMakeYear(normalizedYear || getDefaultMakeYear());
  }, [form.organicClassCode, form.makeYear, form.lotNo, form.productNo]);

  const stockIndex = useMemo(() => {
    const m = new Map<string, ViFactory2Stock>();
    for (const s of factory2Stocks) {
      m.set(`${s.data.lot_no}-${s.data.process_type}-${s.data.product_no}`, s);
    }
    return m;
  }, [factory2Stocks]);

  const stockByLotNo = useMemo(() => {
    const m = new Map<number, ViFactory2Stock[]>();
    for (const s of factory2Stocks) {
      const k = s.data.lot_no;
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    return m;
  }, [factory2Stocks]);

  const stockByProductNo = useMemo(() => {
    const m = new Map<number, ViFactory2Stock[]>();
    for (const s of factory2Stocks) {
      const k = s.data.product_no;
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    return m;
  }, [factory2Stocks]);

  const [stockEntry, setStockEntry] = useState<{
    lotNo: string;
    productNo: string;
    useQuantity: string;
    stockKey: string;
  }>(() => ({ lotNo: "", productNo: "", useQuantity: "", stockKey: "" }));

  const selectedStock = useMemo(() => {
    if (!stockEntry.stockKey) return null;
    return stockIndex.get(stockEntry.stockKey) ?? null;
  }, [stockEntry.stockKey, stockIndex]);

  const pickBest = (list: ViFactory2Stock[]): ViFactory2Stock => {
    // 在庫重量の大きいものを優先（同値なら lot_no/product_no の小さい順）
    return [...list].sort((a, b) => {
      const sa = a.data.factory2_stock ?? 0;
      const sb = b.data.factory2_stock ?? 0;
      if (sb !== sa) return sb - sa;
      if (a.data.lot_no !== b.data.lot_no) return a.data.lot_no - b.data.lot_no;
      return a.data.product_no - b.data.product_no;
    })[0];
  };

  const setSelectedStock = (s: ViFactory2Stock | null) => {
    if (!s) {
      setStockEntryError("");
      setStockEntry((p) => ({ ...p, stockKey: "", useQuantity: "" }));
      return;
    }
    const key = `${s.data.lot_no}-${s.data.process_type}-${s.data.product_no}`;
    setStockEntryError("");
    setStockEntry((p) => ({
      ...p,
      lotNo: String(s.data.lot_no),
      productNo: String(s.data.product_no),
      stockKey: key,
      useQuantity: useQuantityFromStock(s.data.factory2_stock)
    }));
  };

  const lookupByLotNo = () => {
    const lotNoText = stockEntry.lotNo.trim();
    const lotNo = Number(lotNoText);
    if (!lotNoText || !Number.isFinite(lotNo)) return;
    const list = stockByLotNo.get(lotNo) ?? [];
    setSelectedStock(list.length ? pickBest(list) : null);
  };

  const lookupByProductNo = () => {
    const productNoText = stockEntry.productNo.trim();
    const productNo = Number(productNoText);
    if (!productNoText || !Number.isFinite(productNo)) return;
    const list = stockByProductNo.get(productNo) ?? [];
    setSelectedStock(list.length ? pickBest(list) : null);
  };

  const maxUseQuantity = selectedStock?.data.factory2_stock ?? null;

  const addStockRow = () => {
    if (!selectedStock) return;
    const qtyText = normalizeUseQuantityInput(stockEntry.useQuantity, maxUseQuantity);
    const qty = parseUseQuantityInput(qtyText);
    if (qty == null || qty <= 0) return;
    const s = selectedStock.data;
    const isDuplicate = partItems.some(
      (r) => String(r.lotNo) === String(s.lot_no) && String(r.productNo) === String(s.product_no)
    );
    if (isDuplicate) {
      setStockEntryError("既に一覧にある使用部品は追加できません。");
      return;
    }
    setPartItems((prev) => [
      ...prev,
      {
        id: `stock-${s.lot_no}-${s.product_no}-${Date.now()}`,
        parentLotNo: "",
        partLotNo: String(s.lot_no),
        lotNo: String(s.lot_no),
        processName: s.process_type_name ?? "",
        partNo: String(s.lot_no),
        productNo: String(s.product_no),
        partName: s.lot_name ?? "",
        makeYear: s.make_year ?? "",
        count: s.count ?? "",
        useQuantity: qtyText,
        remarks: ""
      }
    ]);
    setStockEntryError("");
    setStockEntry({ lotNo: "", productNo: "", useQuantity: "", stockKey: "" });
  };

  const processCode = form.processTypeCode as Factory2ProcessFilter;
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isView = mode === "view";
  /** 登録・変更… 在庫検索・使用部品追加・一覧削除（表示モードは参照のみ） */
  const canEditParts = mode === "update" || mode === "create";
  const canOpenReport = isUpdate || isView;
  const canOpenGradeSheet = (isUpdate || isView) && isFactory2OrganicTea(organicClassCode);
  const handleDeletePartRow = useCallback((id: string) => {
    setPartItems((prev) => prev.filter((r) => r.id !== id));
  }, []);
  const canEditOrganicClass = mode === "create" || mode === "update";
  const canEditMakeYear = mode === "create" || mode === "update";

  const showGradeNo =
    mode === "view" &&
    isFactory2LotStatusConfirmed(form.lotStatusCode) &&
    organicClassCode === "A" &&
    normalizeProcessTypeCode(String(form.processTypeCode)) === "05";

  const machineItems = useMemo(
    () => [
      { label: "1号機", checked: form.checks.useDeviceUnit1 },
      { label: "2号機", checked: form.checks.useDeviceUnit2 },
      { label: "3号機", checked: form.checks.useDeviceUnit3 }
    ],
    [form.checks]
  );

  const packingItems = useMemo(
    () => [
      { label: "平袋(小)", checked: form.checks.packingCase1 },
      { label: "大海袋", checked: form.checks.packingCase2 }
    ],
    [form.checks]
  );

  const confirmItems = useMemo(
    () => [
      { label: "作業前清掃", checked: form.checks.workBeforeCleaning },
      { label: "作業後清掃", checked: form.checks.workAfterCleaning },
      { label: "装置設定", checked: form.checks.device },
      { label: "空動作", checked: form.checks.operation },
      { label: "残留物", checked: form.checks.rest },
      { label: "磁石清掃", checked: form.checks.magnetCleaning }
    ],
    [form.checks]
  );

  const headerError = localError || mutationError || "";

  const handleRegister = async () => {
    setLocalError("");
    setMutationError(null);
    const panel = panelRef.current;
    if (!panel) {
      setLocalError("画面の読み取りに失敗しました。");
      return;
    }
    const payload = collectFactory2LotCreatePayload(panel, form, partItems, organicClassCode, makeYear);
    const ok = await runBusy(async () => createLot(payload), "登録処理中…");
    if (ok) onClose();
  };

  const handleUpdate = async () => {
    setLocalError("");
    setMutationError(null);
    const panel = panelRef.current;
    if (!panel) {
      setLocalError("画面の読み取りに失敗しました。");
      return;
    }
    const payload = collectFactory2LotUpdatePayload(panel, form, partItems, organicClassCode, makeYear);
    if (!payload) {
      setLocalError("ロットNoが不正です。");
      return;
    }
    const ok = await runBusy(async () => updateLot(payload), "変更処理中…");
    if (ok) onClose();
  };

  const handleDelete = async () => {
    const lotNo = form.lotNo;
    if (lotNo == null || !Number.isFinite(lotNo)) {
      setLocalError("ロットNoが不正です。");
      return;
    }
    if (!window.confirm(`ロットNo ${lotNo} を削除します。よろしいですか？`)) {
      return;
    }
    setLocalError("");
    setMutationError(null);
    const ok = await runBusy(async () => deleteLot(lotNo), "削除処理中…");
    if (ok) {
      onDeleted?.();
      onClose();
    }
  };

  const handlePreviewReport = async () => {
    setLocalError("");
    setMutationError(null);
    try {
      await runBusy(
        () =>
          previewFactory2ReportViaHelper(
            {
              panel: panelRef.current,
              form,
              partRows: partItems,
              organicClassCode,
              makeYear,
              cache: masterCache
            },
            mode
          ),
        "報告書プレビューを起動中…"
      );
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "報告書プレビューの起動に失敗しました。");
    }
  };

  const handlePreviewGradeSheet = async () => {
    setLocalError("");
    setMutationError(null);
    if (form.lotNo == null || !Number.isFinite(form.lotNo)) {
      setLocalError("ロットNoが不正です。");
      return;
    }
    try {
      await runBusy(
        () =>
          previewFactory2GradeReportViaHelper(
            {
              panel: panelRef.current,
              form,
              partRows: partItems,
              organicClassCode,
              makeYear,
              cache: masterCache
            },
            mode
          ),
        "格付表プレビューを起動中…"
      );
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "格付表プレビューの起動に失敗しました。");
    }
  };

  return (
    <section
      ref={panelRef}
      className="modalPanel f2EditPanel"
      onClick={(e) => e.stopPropagation()}
      aria-labelledby="f2-edit-title"
    >
      <header className="f2EditToolbar">
        <h2 id="f2-edit-title" className="f2EditPanelTitle">
          第2工場製造ロット登録
        </h2>
        <button
          type="button"
          disabled={mode !== "create"}
          onClick={mode === "create" ? () => void handleRegister() : undefined}
        >
          登録
        </button>
        <button
          type="button"
          disabled={mode !== "update"}
          onClick={mode === "update" ? () => void handleUpdate() : undefined}
        >
          変更
        </button>
        <button
          type="button"
          disabled={mode !== "update"}
          onClick={mode === "update" ? () => void handleDelete() : undefined}
        >
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
                : !isFactory2OrganicTea(organicClassCode)
                  ? "茶区分が有機茶のときのみ利用できます"
                  : "格付表"
          }
          onClick={() => void handlePreviewGradeSheet()}
        >
          格付表
        </button>
        <button type="button" disabled={mode !== "update"}>
          在庫確定
        </button>
        {showGradeNo ? (
          <div className="f2EditGradeGroup">
            <span className="f2EditGradeLabel">格付表</span>
            <input
              className="f2EditGradeNo"
              type="text"
              readOnly
              value={form.gradeNo != null ? String(form.gradeNo) : ""}
              aria-label="格付表"
            />
          </div>
        ) : null}
        <button className="modalCloseButton" type="button" onClick={onClose} style={{ marginLeft: "auto" }}>
          閉じる
        </button>
      </header>

      {headerError ? (
        <p className="fieldErrorText" style={{ margin: "0 0 6px" }} role="alert">
          {headerError}
        </p>
      ) : null}

      {form.planContext ? (
        <div className="f2EditPlanContext" aria-label="月次計画">
          <span>計画No {form.planContext.planNo}</span>
          {form.planContext.year != null && form.planContext.month != null ? (
            <span>
              {" "}
              年月 {form.planContext.year}年{String(form.planContext.month).padStart(2, "0")}月
            </span>
          ) : null}
        </div>
      ) : null}

      {form.planWarnings && form.planWarnings.length > 0 ? (
        <div className="f2EditPlanNotice" role="status">
          {form.planWarnings.map((message, index) => (
            <p key={`${index}-${message}`}>{message}</p>
          ))}
        </div>
      ) : null}

      <div className="f2EditBlock f2EditRow">
        <LabelCell width={50}>製造No</LabelCell>
        <ValueCell width={70}>
          <div className="f2EditProductNo">
            <span className="f2EditProductNoPrefix">{organicClassCode}</span>
            <span className="f2EditProductNoSep">-</span>
            <span>{form.productNo ?? ""}</span>
          </div>
        </ValueCell>
        <LabelCell width={30}>年</LabelCell>
        <ValueCell width={46}>
          <Factory2MakeYearSpinner
            value={makeYear}
            onChange={setMakeYear}
            readOnly={!canEditMakeYear}
          />
        </ValueCell>
        <LabelCell width={50}>通称名</LabelCell>
        <ValueCell width={200}>
          <input
            className="f2EditInput f2EditReadonly"
            type="text"
            defaultValue={form.itemName}
            readOnly
            aria-label="通称名"
          />
        </ValueCell>
        <LabelCell width={35}>回数</LabelCell>
        <ValueCell width={30}>
          <input className="f2EditInput" type="text" defaultValue={form.count} aria-label="回数" />
        </ValueCell>
        <LabelCell width={50}>生産日</LabelCell>
        <ValueCell width={95}>
          <input className="f2EditInput" type="date" defaultValue={form.workDate} aria-label="生産日" />
        </ValueCell>
      </div>

      <div className="f2EditSpacer" />

      <div className="f2EditBlock f2EditClassProcessRow">
        <LabelCell width={50}>茶区分</LabelCell>
        <ValueCell width={248}>
          <div className="f2EditRadios" role="radiogroup" aria-label="茶区分">
            {ORGANIC_CLASS_OPTIONS.map((opt) => (
              <label key={opt.code}>
                <input
                  type="radio"
                  name="f2-tea-class"
                  value={opt.code}
                  checked={organicClassCode === opt.code}
                  onChange={() => canEditOrganicClass && setOrganicClassCode(opt.code)}
                  disabled={!canEditOrganicClass}
                  aria-label={opt.label}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </ValueCell>
        <LabelCell width={60}>プロセス</LabelCell>
        <ValueCell width={480}>
          <div className="f2EditRadios" role="radiogroup" aria-label="プロセス">
            {PROCESS_HEADER_OPTIONS.map((opt) => (
              <label key={opt.code}>
                <input
                  type="radio"
                  name="f2-process-header"
                  defaultChecked={processCode === opt.code}
                  disabled
                  readOnly
                />
                {opt.label}
              </label>
            ))}
          </div>
        </ValueCell>
      </div>

      <div className="f2EditSpacer" />

      <table className="f2EditSummaryTable" aria-label="製造サマリ">
        <colgroup>
          <col style={{ width: 180 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 70 }} />
          <col style={{ width: 70 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">部品名</th>
            <th scope="col">梱包重量</th>
            <th scope="col">梱包数</th>
            <th scope="col">端数重量</th>
            <th scope="col">端数数</th>
            <th scope="col">製造数(Kg)</th>
            <th scope="col">
              <button type="button" className="f2EditBtnPaleGreen">
                投入数(Kg)
              </button>
            </th>
            <th scope="col">適用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input className="f2EditInput" type="text" defaultValue={form.lotName} aria-label="部品名" />
            </td>
            <td>
              <input className="f2EditInput f2EditInputRight" type="text" defaultValue={form.unitWeight} aria-label="梱包重量" />
            </td>
            <td>
              <input className="f2EditInput f2EditInputRight" type="text" defaultValue={form.unitNumber} aria-label="梱包数" />
            </td>
            <td>
              <input className="f2EditInput f2EditInputRight" type="text" defaultValue={form.fractionWeight} aria-label="端数重量" />
            </td>
            <td>
              <input className="f2EditInput f2EditInputRight" type="text" defaultValue={form.fractionNumber} aria-label="端数数" />
            </td>
            <td>
              <span className="f2EditReadonly f2EditReadonlyRight" style={{ display: "block", padding: "4px" }}>
                {form.productQuantity}
              </span>
            </td>
            <td>
              <span className="f2EditReadonly f2EditReadonlyRight" style={{ display: "block", padding: "4px" }}>
                {form.inputQuantity}
              </span>
            </td>
            <td>
              <input className="f2EditInput" type="text" defaultValue={form.summaryRemarks} aria-label="適用" />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="f2EditSpacerLg" />

      <div className="f2EditBlock f2EditRow">
        <CheckPanel title="使用機械" items={machineItems} readOnly={!canEditParts} />
        <CheckPanel title="上り梱包形態" items={packingItems} readOnly={!canEditParts} />
        <CheckPanel title="確認チェック" items={confirmItems} readOnly={!canEditParts} />
      </div>

      <table className="f2EditSummaryTable f2EditEnvTable" aria-label="室内温度・湿度・時刻">
        <colgroup>
          <col style={{ width: 72 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 180 }} />
          <col style={{ width: 180 }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">室内温度(℃)</th>
            <th scope="col">室内湿度(％)</th>
            <th scope="col">製造開始時間</th>
            <th scope="col">製造終了時間</th>
            <th scope="col">作業前清掃時刻</th>
            <th scope="col">作業後清掃時刻</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                className="f2EditInput f2EditEnvNumber"
                type="number"
                min={0}
                max={99}
                defaultValue={form.temperature}
                aria-label="室内温度"
              />
            </td>
            <td>
              <input
                className="f2EditInput f2EditEnvNumber"
                type="number"
                min={0}
                max={99}
                defaultValue={form.humidity}
                aria-label="室内湿度"
              />
            </td>
            <td>
              <input
                className="f2EditInput f2EditEnvTimeSingle"
                type="time"
                defaultValue={formatTimeValue(form.workStart.hh, form.workStart.mm)}
                aria-label="製造開始時間"
              />
            </td>
            <td>
              <input
                className="f2EditInput f2EditEnvTimeSingle"
                type="time"
                defaultValue={formatTimeValue(form.workEnd.hh, form.workEnd.mm)}
                aria-label="製造終了時間"
              />
            </td>
            <td>
              <div className="f2EditEnvRangeCell">
                <input
                  className="f2EditInput f2EditEnvTimeRange"
                  type="time"
                  defaultValue={formatTimeValue(form.cleaningBefore.startHh, form.cleaningBefore.startMm)}
                  aria-label="作業前清掃 開始"
                />
                <span className="f2EditTimeSep">～</span>
                <input
                  className="f2EditInput f2EditEnvTimeRange"
                  type="time"
                  defaultValue={formatTimeValue(form.cleaningBefore.endHh, form.cleaningBefore.endMm)}
                  aria-label="作業前清掃 終了"
                />
              </div>
            </td>
            <td>
              <div className="f2EditEnvRangeCell">
                <input
                  className="f2EditInput f2EditEnvTimeRange"
                  type="time"
                  defaultValue={formatTimeValue(form.cleaningAfter.startHh, form.cleaningAfter.startMm)}
                  aria-label="作業後清掃 開始"
                />
                <span className="f2EditTimeSep">～</span>
                <input
                  className="f2EditInput f2EditEnvTimeRange"
                  type="time"
                  defaultValue={formatTimeValue(form.cleaningAfter.endHh, form.cleaningAfter.endMm)}
                  aria-label="作業後清掃 終了"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="f2EditSpacerLg" />

      <div className="f2EditPartsSection">
        <div className="f2EditPartsSectionHeader">
          <h3 className="f2EditPartsSectionTitle">使用部品情報</h3>
          {canEditParts ? (
            <button
              type="button"
              className="f2EditStockZoomOpenButton"
              onClick={() => setStockZoomOpen(true)}
            >
              ロット在庫一覧
            </button>
          ) : null}
        </div>

        {canEditParts ? (
          <div className="f2EditStockEntryBlock">
            <table className="f2EditSummaryTable f2EditStockEntryTable" aria-label="在庫検索・登録">
              <colgroup>
                <col style={{ width: 80 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 72 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">
                    <button type="button" className="f2EditBtnPaleGreen f2EditStockHeaderButton" onClick={lookupByLotNo}>
                      ロットNo
                    </button>
                  </th>
                  <th scope="col">
                    <button type="button" className="f2EditBtnPaleGreen f2EditStockHeaderButton" onClick={lookupByProductNo}>
                      製造No
                    </button>
                  </th>
                  <th scope="col">工程</th>
                  <th scope="col">使用部品名</th>
                  <th scope="col">製造日</th>
                  <th scope="col">有機区分</th>
                  <th scope="col">年度</th>
                  <th scope="col">回数</th>
                  <th scope="col">製造重量</th>
                  <th scope="col">在庫重量</th>
                  <th scope="col">使用量</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      className="f2EditInput f2EditInputRight"
                      type="text"
                      value={stockEntry.lotNo}
                      onChange={(e) =>
                        (setStockEntryError(""),
                        setStockEntry((p) => ({ ...p, lotNo: e.target.value, stockKey: "", useQuantity: "" })))
                      }
                      aria-label="ロットNo"
                    />
                  </td>
                  <td>
                    <input
                      className="f2EditInput f2EditInputRight"
                      type="text"
                      value={stockEntry.productNo}
                      onChange={(e) =>
                        (setStockEntryError(""),
                        setStockEntry((p) => ({ ...p, productNo: e.target.value, stockKey: "", useQuantity: "" })))
                      }
                      aria-label="製造No"
                    />
                  </td>
                  <td className="f2EditReadonlyCell">{selectedStock?.data.process_type_name ?? ""}</td>
                  <td className="f2EditReadonlyCell">{selectedStock?.data.lot_name ?? ""}</td>
                  <td className="f2EditReadonlyCell">{selectedStock?.data.product_date ?? ""}</td>
                  <td className="f2EditReadonlyCell">{selectedStock?.data.organic_class ?? ""}</td>
                  <td className="f2EditReadonlyCell">{selectedStock?.data.make_year ?? ""}</td>
                  <td className="f2EditReadonlyCell">{selectedStock?.data.count ?? ""}</td>
                  <td className="f2EditReadonlyCell">
                    {selectedStock?.data.product_quantity != null ? numberFormatter.format(selectedStock.data.product_quantity) : ""}
                  </td>
                  <td className="f2EditReadonlyCell">
                    {selectedStock?.data.factory2_stock != null ? numberFormatter.format(selectedStock.data.factory2_stock) : ""}
                  </td>
                  <td>
                    <div className="f2EditUseQtyCell">
                      <input
                        className={`f2EditInput f2EditInputRight f2EditDecimalInput${stockEntryError ? " inputError" : ""}`}
                        type="text"
                        inputMode="decimal"
                        value={stockEntry.useQuantity}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "" || /^\d*\.?\d{0,1}$/.test(raw)) {
                            setStockEntryError("");
                            setStockEntry((p) => ({ ...p, useQuantity: raw }));
                          }
                        }}
                        onBlur={() => {
                          setStockEntry((p) => ({
                            ...p,
                            useQuantity: normalizeUseQuantityInput(p.useQuantity, maxUseQuantity)
                          }));
                        }}
                        aria-label="使用量"
                        disabled={!selectedStock}
                        placeholder={
                          maxUseQuantity != null ? `上限 ${numberFormatter.format(maxUseQuantity)}` : ""
                        }
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="f2EditStockEntryActions">
              <button
                type="button"
                className="actionButton"
                onClick={addStockRow}
                disabled={!selectedStock || !(Number(stockEntry.useQuantity) > 0)}
              >
                追加
              </button>
            </div>
            {stockEntryError ? <p className="fieldErrorText">{stockEntryError}</p> : null}
          </div>
        ) : null}

        <div className="f2EditPartsGridWrap">
          <MantineZoomProvider>
            <Factory2LotEditPartsTable
              rows={partItems}
              canDelete={canEditParts}
              onDeleteRow={handleDeletePartRow}
            />
          </MantineZoomProvider>
        </div>
      </div>

      <Factory2StockZoomModal
        open={stockZoomOpen}
        stocks={factory2Stocks}
        onClose={() => setStockZoomOpen(false)}
        onSelect={(stock) => {
          setSelectedStock(stock);
          setStockEntryError("");
        }}
      />
    </section>
  );
}

export function Factory2LotEditModal({
  open,
  mode,
  form,
  factory2Stocks,
  masterCache,
  onClose,
  onDeleted
}: Props) {
  if (!open) return null;

  const contentKey = `${mode}-${form.lotNo ?? "new"}-${form.productNo ?? ""}`;

  return (
    <EditModalOverlay mode={mode} onClose={onClose} className="f2EditOverlay">
      <Factory2LotEditModalContent
        key={contentKey}
        mode={mode}
        form={form}
        factory2Stocks={factory2Stocks}
        masterCache={masterCache}
        onClose={onClose}
        onDeleted={onDeleted}
      />
    </EditModalOverlay>
  );
}
