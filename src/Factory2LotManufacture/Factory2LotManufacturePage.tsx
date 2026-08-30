/**
 * 第二工場ロット製造登録
 * 一覧は sql/CroudeTea.sql 相当を bootstrap 済みマスタ（te_lot_base × te_lot_use_item）から構築。
 */
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  TrItemMasterZoomModal,
  type TrItemZoomFilterParams
} from "../components/TrItemMasterZoomModal";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { buildFactory2LotList, filterFactory2LotRows } from "./buildLotList";
import { isFactory2LotStatusConfirmed } from "./factory2LotDisplay";
import { Factory2FinishedTeaZoomField } from "./Factory2FinishedTeaZoomField";
import { Factory2MakeYearSpinner } from "./Factory2MakeYearSpinner";
import { normalizeMakeYearFromForm } from "./factory2MakeYear";
import {
  buildFactory2LotEditFormForCreate,
  buildFactory2LotEditFormFromRow
} from "./buildFactory2LotEditForm";
import {
  buildFactory2LotEditFormFromMonthlyPlan,
  findMonthlyPlanByPlanNo
} from "./buildFactory2LotEditFormFromMonthlyPlan";
import { Factory2LotEditModal } from "./Factory2LotEditModal";
import { Factory2LotManufactureMantineTable } from "./Factory2LotManufactureMantineTable";
import type { Factory2LotEditFormData, Factory2LotEditMode } from "./factory2LotEditTypes";
import { isFactory2SearchEnabled } from "./factory2SearchCriteria";
import type { Factory2LotRegistProcessFilter, Factory2LotRow, Factory2ProcessFilter } from "./types";
import {
  factory2LotMasterErrorAtom,
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterMonthlyPlansAtom,
  masterTrItemsAtom
} from "../repository/masterData";
import {
  factory2LotProcessFilterAtom,
  factory2LotRegistItemNameAtom,
  factory2LotRegistItemNoAtom,
  factory2LotRegistPlanNoAtom,
  factory2LotSearchAppliedCriteriaAtom,
  factory2LotSearchItemNameAtom,
  factory2LotSearchLotStatusAtom,
  factory2LotSearchOrganicCheckAtom,
  factory2LotSearchProcessCheckAtom,
  factory2LotSearchProductDateAtom,
  factory2LotSearchYearAtom
} from "./store";
import "../MonthlyPlan/styles.css";
import "./styles.css";
import "./factory2LotManufactureTable.css";

export default function Factory2LotManufacturePage() {
  const cache = useAtomValue(masterEntityCacheAtom);
  const monthlyPlans = useAtomValue(masterMonthlyPlansAtom);
  const trItems = useAtomValue(masterTrItemsAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(factory2LotMasterErrorAtom);

  const [processFilter, setProcessFilter] = useAtom(factory2LotProcessFilterAtom);
  const [year, setYear] = useAtom(factory2LotSearchYearAtom);
  const [productDate, setProductDate] = useAtom(factory2LotSearchProductDateAtom);
  const [selectedItemName, setSelectedItemName] = useAtom(factory2LotSearchItemNameAtom);
  const [registItemNo, setRegistItemNo] = useAtom(factory2LotRegistItemNoAtom);
  const [registItemName, setRegistItemName] = useAtom(factory2LotRegistItemNameAtom);
  const [registPlanNo, setRegistPlanNo] = useAtom(factory2LotRegistPlanNoAtom);
  const [itemZoomTarget, setItemZoomTarget] = useState<"search" | "register" | null>(null);
  const itemZoomOpen = itemZoomTarget !== null;
  const [editModal, setEditModal] = useState<{
    mode: Factory2LotEditMode;
    form: Factory2LotEditFormData;
  } | null>(null);
  const [appliedCriteria, setAppliedCriteria] = useAtom(factory2LotSearchAppliedCriteriaAtom);

  const factory2TrItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(
    () => ({ systemClass: "2" }),
    []
  );

  const [lotStatusCheck, setLotStatusCheck] = useAtom(factory2LotSearchLotStatusAtom);
  const [processCheck, setProcessCheck] = useAtom(factory2LotSearchProcessCheckAtom);
  const [organicCheck, setOrganicCheck] = useAtom(factory2LotSearchOrganicCheckAtom);
  const [yearFilterEnabled, setYearFilterEnabled] = useState(true);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const allRows = useMemo(() => buildFactory2LotList(cache), [cache]);

  const rows = useMemo(() => {
    if (!appliedCriteria) return [];
    return filterFactory2LotRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;

  const searchEnabled = isFactory2SearchEnabled({
    yearFilterEnabled,
    year,
    lotStatusCheck,
    processCheck,
    organicCheck,
    workDate: productDate,
    itemName: selectedItemName
  });

  const handleSearch = () => {
    if (!searchEnabled) return;
    setAppliedCriteria({
      year: yearFilterEnabled ? normalizeMakeYearFromForm(year) : null,
      lotStatusCheck: { ...lotStatusCheck },
      processCheck: { ...processCheck },
      organicCheck: { ...organicCheck },
      workDate: productDate.trim() || null,
      itemNameQuery: selectedItemName.trim()
    });
    setSelectedRowId(null);
  };

  const handleRowSelect = useCallback((row: Factory2LotRow) => {
    setSelectedRowId(row.id);
  }, []);

  const selectedRow = useMemo((): Factory2LotRow | null => {
    if (!selectedRowId) return null;
    return rows.find((row) => row.id === selectedRowId) ?? null;
  }, [selectedRowId, rows]);

  const hasSelection = selectedRow != null;

  const isRegistProcessSelected = (code: Factory2LotRegistProcessFilter): code is Factory2ProcessFilter =>
    code === "02" || code === "03" || code === "04" || code === "05";

  const canOpenCreate =
    isRegistProcessSelected(processFilter) && registItemName.trim().length > 0;

  const openCreateModal = () => {
    if (!canOpenCreate) return;
    let form = buildFactory2LotEditFormForCreate(processFilter, registItemName);
    const planWarnings: string[] = [];
    const planNoText = registPlanNo.trim();

    if (planNoText) {
      const planNo = Number(planNoText);
      const plan = findMonthlyPlanByPlanNo(monthlyPlans, planNoText);
      if (!plan) {
        planWarnings.push(
          `計画No ${planNoText} は見つかりません。工程・通称名のみで開きます。`
        );
        if (Number.isFinite(planNo) && planNo > 0) {
          form = {
            ...form,
            planContext: { planNo, year: null, month: null }
          };
        }
      } else {
        const merged = buildFactory2LotEditFormFromMonthlyPlan(form, plan, {
          menuProcess: processFilter,
          registItemName,
          registItemNo,
          stocks: cache.vi_factory2_stock,
          trItems
        });
        form = merged.form;
        planWarnings.push(...merged.warnings);
      }
    }

    if (planWarnings.length > 0) {
      form = { ...form, planWarnings };
    }

    setEditModal({
      mode: "create",
      form
    });
  };

  const selectedRowIsConfirmed = selectedRow
    ? isFactory2LotStatusConfirmed(selectedRow.lotStatusCode)
    : false;
  const canOpenUpdate = hasSelection && !selectedRowIsConfirmed;
  const canOpenView = hasSelection;

  const openUpdateModal = () => {
    if (!selectedRow || selectedRowIsConfirmed) return;
    setEditModal({
      mode: "update",
      form: buildFactory2LotEditFormFromRow(cache, selectedRow)
    });
  };

  const openViewModal = () => {
    if (!selectedRow) return;
    setEditModal({
      mode: "view",
      form: buildFactory2LotEditFormFromRow(cache, selectedRow)
    });
  };

  return (
    <main className="page factory2LotPage">
      <header className="toolbar">
        <h1 className="title">ロット製造実績一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="factory2Hint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="factory2Hint">
          {searchExecuted
            ? `一覧 ${rows.length} 件（マスタ ${allRows.length} 件${
                appliedCriteria?.year == null ? "・全年度" : `・年度 ${appliedCriteria.year}`
              }）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}

      <section className="factory2ToolbarRow factory2ToolbarRowMenu" aria-label="工程メニュー">
        <fieldset className="factory2GroupBox">
          <legend>工程</legend>
          <label className="factory2RadioLabel">
            <input
              type="radio"
              name="processMenu"
              checked={processFilter === "02"}
              onChange={() => setProcessFilter("02")}
            />
            荒茶配合
          </label>
          <label className="factory2RadioLabel">
            <input
              type="radio"
              name="processMenu"
              checked={processFilter === "03"}
              onChange={() => setProcessFilter("03")}
            />
            仕上
          </label>
          <label className="factory2RadioLabel">
            <input
              type="radio"
              name="processMenu"
              checked={processFilter === "04"}
              onChange={() => setProcessFilter("04")}
            />
            火入
          </label>
          <label className="factory2RadioLabel">
            <input
              type="radio"
              name="processMenu"
              checked={processFilter === "05"}
              onChange={() => setProcessFilter("05")}
            />
            仕上配合
          </label>
        </fieldset>
        <div className="factory2PlanNoGroup">
          <span className="factory2FieldLabel factory2FieldLabelCompact">計画No</span>
          <input
            className="factory2PlanNoInput"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={registPlanNo}
            onChange={(e) => setRegistPlanNo(e.target.value.replace(/\D/g, ""))}
            aria-label="計画No"
            autoComplete="off"
          />
        </div>
        <Factory2FinishedTeaZoomField
          value={registItemName}
          onOpenZoom={() => setItemZoomTarget("register")}
        />
        <div className="factory2MenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canOpenCreate}
            onClick={openCreateModal}
            title={
              canOpenCreate
                ? "新規登録画面を開く"
                : "工程を選択し、仕上茶ZOOMで通称名を指定してください"
            }
          >
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canOpenUpdate}
            title={
              !hasSelection
                ? "行を1件選択してください"
                : selectedRowIsConfirmed
                  ? "確定済みのロットは表示のみ可能です"
                  : "選択行を変更モードで開く"
            }
            onClick={openUpdateModal}
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canOpenView}
            title={canOpenView ? "選択行を表示モードで開く" : "行を1件選択してください"}
            onClick={openViewModal}
          >
            表示
          </button>
        </div>
      </section>

      <section className="factory2ToolbarRow factory2ToolbarRowSearch" aria-label="検索条件">
        <fieldset className="factory2GroupBox factory2SearchYearGroup">
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
            className={`factory2LotMakeYearWrap${yearFilterEnabled ? "" : " isDisabled"}`}
            aria-disabled={!yearFilterEnabled}
          >
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </fieldset>

        <fieldset className="factory2GroupBox">
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
        <fieldset className="factory2GroupBox">
          <legend>工程</legend>
          {(["02", "03", "04", "05"] as const).map((code) => (
            <label key={code} className="factory2CheckLabel">
              <input
                type="checkbox"
                checked={processCheck[code]}
                onChange={(e) => setProcessCheck((p) => ({ ...p, [code]: e.target.checked }))}
              />
              {code === "02" ? "荒茶配合" : code === "03" ? "仕上" : code === "04" ? "火入" : "仕上配合"}
            </label>
          ))}
        </fieldset>
        <fieldset className="factory2GroupBox">
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
        />
        <Factory2FinishedTeaZoomField
          value={selectedItemName}
          fillRemaining
          onOpenZoom={() => setItemZoomTarget("search")}
        />
        <div className="factory2MenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!searchEnabled}
            onClick={handleSearch}
            title={
              searchEnabled
                ? "検索条件で一覧を表示"
                : "年度チェックを入れるか、状態・工程・有機・製造日・仕上茶のいずれかを指定してください"
            }
          >
            検索
          </button>
        </div>
      </section>

      <section className="tableWrap factory2TableWrap">
        <MantineZoomProvider>
          <Factory2LotManufactureMantineTable
            rows={rows}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editModal ? (
        <Factory2LotEditModal
          key={
            editModal.mode === "create"
              ? `create-${processFilter}-${registItemName}-${registPlanNo}`
              : `lot-${editModal.form.lotNo ?? "x"}-${editModal.mode}`
          }
          open
          mode={editModal.mode}
          form={editModal.form}
          factory2Stocks={cache.vi_factory2_stock}
          masterCache={cache}
          onClose={() => setEditModal(null)}
          onDeleted={() => {
            setSelectedRowId(null);
          }}
        />
      ) : null}

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomTarget(null)}
        initialCode={itemZoomTarget === "register" ? registItemNo : ""}
        initialName={itemZoomTarget === "register" ? registItemName : selectedItemName}
        filterParams={factory2TrItemZoomFilterParams}
        onSelect={(code, name) => {
          const trimmedName = name.trim();
          const trimmedCode = code.trim();
          if (itemZoomTarget === "register") {
            setRegistItemNo(trimmedCode);
            setRegistItemName(trimmedName);
          } else {
            setSelectedItemName(trimmedName);
          }
          setItemZoomTarget(null);
        }}
        onClear={() => {
          if (itemZoomTarget === "register") {
            setRegistItemNo("");
            setRegistItemName("");
          } else {
            setSelectedItemName("");
          }
          setItemZoomTarget(null);
        }}
      />
    </main>
  );
}
