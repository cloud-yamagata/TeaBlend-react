/**
 * パッケージロット登録（PackageReport MainWindow.xaml 相当）
 */
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  TrItemMasterZoomModal,
  type TrItemZoomFilterParams
} from "../components/TrItemMasterZoomModal";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterTrItemsAtom,
  packageLotMasterErrorAtom
} from "../repository/masterData";
import { buildPackageLotEditFormFromRow } from "./buildPackageLotEditFormFromRow";
import { buildPackageLotList } from "./buildPackageLotList";
import { filterPackageLotRows } from "./filterPackageLotRows";
import { isPackageLotSearchEnabled } from "./packageLotSearchCriteria";
import { createEmptyPackageLotEditForm } from "./createEmptyPackageLotEditForm";
import { PackageLotEditModal } from "./PackageLotEditModal";
import { isPackageLotStatusConfirmed } from "./packageLotDisplay";
import { PackageLotRegistTable } from "./PackageLotRegistTable";
import type { PackageLotAppliedSearchCriteria, PackageLotRegistRow } from "./types";
import type { PackageLotEditFormData, PackageLotEditMode } from "./packageLotEditTypes";
import "./packageLotRegist.css";

const defaultLotStatusCheck = () => ({
  active: false,
  measure: false,
  complete: false,
  confirm: false
});

const defaultOrganicCheck = () => ({
  organic: false,
  pesticideFree: false,
  general: false
});

export default function PackageLotRegistPage() {
  const cache = useAtomValue(masterEntityCacheAtom);
  const trItems = useAtomValue(masterTrItemsAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(packageLotMasterErrorAtom);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [yearFilterEnabled, setYearFilterEnabled] = useState(true);
  const [year, setYear] = useState(getDefaultMakeYear);
  const [productDate, setProductDate] = useState("");
  const [searchItemNo, setSearchItemNo] = useState("");
  const [searchProductName, setSearchProductName] = useState("");
  const [itemZoomOpen, setItemZoomOpen] = useState(false);
  const [lotStatusCheck, setLotStatusCheck] = useState(defaultLotStatusCheck);
  const [organicCheck, setOrganicCheck] = useState(defaultOrganicCheck);
  const [appliedCriteria, setAppliedCriteria] = useState<PackageLotAppliedSearchCriteria | null>(
    null
  );
  const [editModal, setEditModal] = useState<{
    mode: PackageLotEditMode;
    form: PackageLotEditFormData;
  } | null>(null);

  const packageTrItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(
    () => ({ systemClass: "1" }),
    []
  );

  const allRows = useMemo(() => buildPackageLotList(cache), [cache]);

  const rows = useMemo(() => {
    if (!appliedCriteria) return [];
    return filterPackageLotRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;

  const searchEnabled = isPackageLotSearchEnabled({
    yearFilterEnabled,
    year,
    lotStatusCheck,
    organicCheck,
    workDate: productDate,
    itemNo: searchItemNo,
    productName: searchProductName
  });

  const handleSearch = () => {
    if (!searchEnabled) return;
    const itemNo = searchItemNo.trim() ? Number(searchItemNo.trim()) : null;
    setAppliedCriteria({
      year: yearFilterEnabled ? normalizeMakeYearFromForm(year) : null,
      lotStatusCheck: { ...lotStatusCheck },
      organicCheck: { ...organicCheck },
      workDate: productDate.trim() || null,
      itemNo: itemNo != null && Number.isFinite(itemNo) ? itemNo : null,
      productNameQuery: searchProductName.trim()
    });
    setSelectedRowId(null);
  };

  const handleRowSelect = useCallback((row: PackageLotRegistRow) => {
    setSelectedRowId(row.id);
  }, []);

  const selectedRow = useMemo((): PackageLotRegistRow | null => {
    if (!selectedRowId) return null;
    return rows.find((row) => row.id === selectedRowId) ?? null;
  }, [selectedRowId, rows]);

  const hasSelection = selectedRow != null;

  const selectedRowIsConfirmed = selectedRow
    ? isPackageLotStatusConfirmed(selectedRow.lotStatusCode)
    : false;
  const canOpenUpdate = hasSelection && !selectedRowIsConfirmed;
  const canOpenView = hasSelection;

  const openCreateModal = () => {
    setEditModal({
      mode: "create",
      form: createEmptyPackageLotEditForm()
    });
  };

  const openUpdateModal = () => {
    if (!selectedRow || selectedRowIsConfirmed) return;
    setEditModal({
      mode: "update",
      form: buildPackageLotEditFormFromRow(cache, selectedRow, trItems)
    });
  };

  const openViewModal = () => {
    if (!selectedRow) return;
    setEditModal({
      mode: "view",
      form: buildPackageLotEditFormFromRow(cache, selectedRow, trItems)
    });
  };

  return (
    <main className="page packageLotPage">
      <header className="toolbar">
        <h1 className="title">パッケージロット登録</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="packageLotHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="packageLotHint">
          {searchExecuted
            ? `一覧 ${rows.length} 件（マスタ ${allRows.length} 件${
                appliedCriteria?.year == null ? "・全年度" : `・年度 ${appliedCriteria.year}`
              }）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}

      <section className="packageLotToolbarRow packageLotToolbarRowMenu" aria-label="登録メニュー">
        <div className="packageLotMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            onClick={openCreateModal}
            title="製造報告書を新規登録"
          >
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canOpenUpdate}
            onClick={openUpdateModal}
            title={
              !hasSelection
                ? "行を1件選択してください"
                : selectedRowIsConfirmed
                  ? "確定済みのロットは表示のみ可能です"
                  : "選択行を変更モードで開く"
            }
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canOpenView}
            onClick={openViewModal}
            title={canOpenView ? "選択行を表示モードで開く" : "行を1件選択してください"}
          >
            表示
          </button>
        </div>
      </section>

      <section className="packageLotSearchPanel" aria-label="検索条件">
        <fieldset className="packageLotSearchGroupBox packageLotSearchYearGroup">
          <legend>年度</legend>
          <label className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={yearFilterEnabled}
              onChange={(e) => setYearFilterEnabled(e.target.checked)}
              aria-label="年度で絞り込む"
            />
          </label>
          <div
            className={`packageLotMakeYearWrap${yearFilterEnabled ? "" : " isDisabled"}`}
            aria-disabled={!yearFilterEnabled}
          >
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </fieldset>

        <fieldset className="packageLotSearchGroupBox">
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
              checked={lotStatusCheck.measure}
              onChange={(e) => setLotStatusCheck((p) => ({ ...p, measure: e.target.checked }))}
            />
            測定
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
        <fieldset className="packageLotSearchGroupBox">
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
        <span className="factory2FieldLabel factory2FieldLabelCompact">製造日</span>
        <input
          className="factory2TextInput date factory2DateCompact"
          type="date"
          value={productDate}
          onChange={(e) => setProductDate(e.target.value)}
          aria-label="製造日"
        />
        <span className="factory2FieldLabel factory2FieldLabelCompact">商品No</span>
        <input
          className="packageLotSearchItemNoInput"
          type="text"
          inputMode="numeric"
          value={searchItemNo}
          onChange={(e) => setSearchItemNo(e.target.value)}
          autoComplete="off"
          aria-label="商品No"
        />
        <span className="factory2FieldLabel factory2FieldLabelCompact">商品名</span>
        <input
          className="packageLotSearchItemNameInput"
          type="text"
          value={searchProductName}
          onChange={(e) => setSearchProductName(e.target.value)}
          autoComplete="off"
          aria-label="商品名"
        />
        <button type="button" className="factory2DarkButton" onClick={() => setItemZoomOpen(true)}>
          商品名
        </button>
        <button
          type="button"
          className="factory2DarkButton packageLotSearchButton"
          disabled={!searchEnabled}
          onClick={handleSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "年度チェックを入れるか、状態・有機・製造日・商品のいずれかを指定してください"
          }
        >
          検索
        </button>
      </section>

      <section className="tableWrap packageLotTableWrap">
        <MantineZoomProvider>
          <PackageLotRegistTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editModal ? (
        <PackageLotEditModal
          key={`${editModal.mode}-${editModal.form.productNo || "new"}`}
          open
          mode={editModal.mode}
          initialForm={editModal.form}
          onClose={() => setEditModal(null)}
          onDeleted={() => setSelectedRowId(null)}
        />
      ) : null}

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={searchItemNo}
        initialName={searchProductName}
        filterParams={packageTrItemZoomFilterParams}
        onSelect={(code, name) => {
          setSearchItemNo(code.trim());
          setSearchProductName(name.trim());
          setItemZoomOpen(false);
        }}
        onClear={() => {
          setSearchItemNo("");
          setSearchProductName("");
          setItemZoomOpen(false);
        }}
      />
    </main>
  );
}
