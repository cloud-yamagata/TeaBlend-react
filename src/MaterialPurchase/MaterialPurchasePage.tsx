/**
 * 仕上品仕入登録（MaterialPurchase MainWindow.xaml 相当）
 *
 * 登録 → EditType=1 / 変更 → EditType=2（更新モード）
 * 検索条件: 年度・商品No・商品名・仕入日・仕入先
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { TrConstantZoomModal } from "../components/TrConstantZoomModal";
import {
  TrItemMasterZoomModal,
  type TrItemZoomFilterParams
} from "../components/TrItemMasterZoomModal";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterTrConstantsAtom,
  masterTrItemsAtom,
  materialPurchaseMasterErrorAtom
} from "../repository/masterData";
import { MaterialPurchaseEditModal } from "./MaterialPurchaseEditModal";
import { MaterialPurchaseSearchPanel } from "./MaterialPurchaseSearchPanel";
import { MaterialPurchaseMantineTable } from "./materialPurchaseMantineTable";
import { resolveMaterialPurchaseItem } from "./resolveMaterialPurchaseItem";
import {
  filteredMaterialPurchaseListAtom,
  materialPurchaseListAtom,
  materialPurchaseSearchAppliedFiltersAtom,
  materialPurchaseSearchDraftAtom,
  materialPurchaseSearchExecutedAtom,
  type MaterialPurchaseSearchFilters
} from "./store";
import {
  materialPurchaseRowToCreateForm,
  materialPurchaseRowToEditForm,
  type MaterialPurchaseEditForm,
  type MaterialPurchaseEditMode,
  type MaterialPurchaseRow
} from "./types";
import "./styles.css";

const parseDraftItemNo = (text: string): number | null => {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export default function MaterialPurchasePage() {
  const allRows = useAtomValue(materialPurchaseListAtom);
  const rows = useAtomValue(filteredMaterialPurchaseListAtom);
  const trItems = useAtomValue(masterTrItemsAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(materialPurchaseMasterErrorAtom);
  const setAppliedFilters = useSetAtom(materialPurchaseSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(materialPurchaseSearchExecutedAtom);
  const setDraft = useSetAtom(materialPurchaseSearchDraftAtom);
  const searchExecuted = useAtomValue(materialPurchaseSearchExecutedAtom);
  const draft = useAtomValue(materialPurchaseSearchDraftAtom);

  const [itemZoomOpen, setItemZoomOpen] = useState(false);
  const [supplierZoomOpen, setSupplierZoomOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<MaterialPurchaseEditMode>("create");
  const [editForm, setEditForm] = useState<MaterialPurchaseEditForm | null>(null);
  const [registerError, setRegisterError] = useState("");

  const itemZoomFilterParams = useMemo<TrItemZoomFilterParams>(
    () => ({ systemClass: "2", itemGroupNo: 4 }),
    []
  );

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  /** 変更：一覧検索後かつ明細行選択時のみ活性 */
  const canChange = searchExecuted && selectedRow != null;

  const handleSearch = (filters: MaterialPurchaseSearchFilters) => {
    const resolved = resolveMaterialPurchaseItem(
      trItems,
      parseDraftItemNo(filters.itemNo),
      filters.itemName
    );
    const next: MaterialPurchaseSearchFilters = resolved
      ? {
          ...filters,
          itemNo: String(resolved.itemNo),
          itemName: resolved.itemName
        }
      : { ...filters };
    if (!next.year.trim()) return;
    setDraft(next);
    setAppliedFilters(next);
    setSearchExecuted(true);
    setSelectedRowId(null);
    setRegisterError("");
  };

  const handleRowSelect = useCallback((row: MaterialPurchaseRow) => {
    setSelectedRowId(row.id);
  }, []);

  /**
   * 登録モードで EditWindow を開く
   * 一覧で行選択あり → 仕入日・仕入No 以外を選択行から反映
   */
  const openRegister = () => {
    setRegisterError("");

    if (selectedRow) {
      setDraft((prev) => ({
        ...prev,
        itemNo: String(selectedRow.itemNo),
        itemName: selectedRow.itemName
      }));
      setEditMode("create");
      setEditForm(materialPurchaseRowToCreateForm(selectedRow));
      setEditOpen(true);
      return;
    }

    const resolved = resolveMaterialPurchaseItem(
      trItems,
      parseDraftItemNo(draft.itemNo),
      draft.itemName
    );
    if (!resolved) {
      setRegisterError("指定された仕上商品は登録できません。商品ZOOMで選択してください。");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      itemNo: String(resolved.itemNo),
      itemName: resolved.itemName
    }));

    setEditMode("create");
    setEditForm({
      purchaseDate: "",
      itemNo: resolved.itemNo,
      purchaseNo: 0,
      itemName: resolved.itemName,
      purchaseLotNo: "",
      purchaseQuantity: "",
      supplier: ""
    });
    setEditOpen(true);
  };

  /**
   * 更新モードで EditWindow を開く
   * ※ 更新ボタン押下後の永続化は未実装（処理前まで）
   */
  const openChange = () => {
    setRegisterError("");
    if (!selectedRow) {
      setRegisterError("変更する仕入実績を一覧から選択してください。");
      return;
    }
    setEditMode("update");
    setEditForm(materialPurchaseRowToEditForm(selectedRow));
    setEditOpen(true);
  };

  return (
    <main className="page materialPurchasePage">
      <header className="toolbar">
        <h1 className="title">仕上品仕入登録</h1>
        <p className="materialPurchaseHint">
          {searchExecuted
            ? `一覧 ${rows.length.toLocaleString("ja-JP")} 件（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : `マスタ ${allRows.length.toLocaleString("ja-JP")} 件`}
        </p>
      </header>

      {loading ? <p className="status">マスタ読み込み中...</p> : null}
      {masterError ? <p className="status error">{masterError}</p> : null}
      {registerError ? (
        <p className="status error" role="alert">
          {registerError}
        </p>
      ) : null}

      <nav className="materialPurchaseMenuRow" aria-label="登録メニュー">
        <button
          type="button"
          className="materialPurchaseMenuItem"
          onClick={openRegister}
          title="選択商品の仕入実績を登録"
        >
          登録
        </button>
        <button
          type="button"
          className="materialPurchaseMenuItem"
          disabled={!canChange}
          onClick={openChange}
          title={
            canChange
              ? "選択行の仕入実績を変更"
              : searchExecuted
                ? "変更する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          変更
        </button>
      </nav>

      <MaterialPurchaseSearchPanel
        onSearch={handleSearch}
        onOpenItemZoom={() => setItemZoomOpen(true)}
        onOpenSupplierZoom={() => setSupplierZoomOpen(true)}
      />

      <section className="tableWrap">
        <MantineZoomProvider>
          <MaterialPurchaseMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <MaterialPurchaseEditModal
          open={editOpen}
          mode={editMode}
          initialForm={editForm}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
          onRegistered={(purchaseNo) => {
            setSelectedRowId(`${editForm.itemNo}-${purchaseNo}`);
          }}
          onUpdated={(purchaseNo) => {
            setSelectedRowId(`${editForm.itemNo}-${purchaseNo}`);
          }}
        />
      ) : null}

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={draft.itemNo}
        initialName={draft.itemName}
        filterParams={itemZoomFilterParams}
        onSelect={(code, name) => {
          setDraft((prev) => ({
            ...prev,
            itemNo: code.trim(),
            itemName: name.trim()
          }));
          setRegisterError("");
          setItemZoomOpen(false);
        }}
        onClear={() => {
          setDraft((prev) => ({
            ...prev,
            itemNo: "",
            itemName: ""
          }));
          setItemZoomOpen(false);
        }}
      />

      <TrConstantZoomModal
        open={supplierZoomOpen}
        onClose={() => setSupplierZoomOpen(false)}
        constField="purchase3"
        title="仕入先"
        constants={trConstants}
        onSelect={(_constValue, constName) => {
          setDraft((prev) => ({
            ...prev,
            supplier: constName.trim()
          }));
          setSupplierZoomOpen(false);
        }}
        onClear={() => {
          setDraft((prev) => ({
            ...prev,
            supplier: ""
          }));
          setSupplierZoomOpen(false);
        }}
      />
    </main>
  );
}
