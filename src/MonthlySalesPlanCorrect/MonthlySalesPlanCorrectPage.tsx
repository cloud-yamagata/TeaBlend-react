/**
 * 月次販売計画（指定年月の取得・登録・削除）
 */
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterTrItemsAtom,
  monthlySalesPlanCorrectMasterErrorAtom
} from "../repository/masterData";
import {
  deleteTeMonthlySalesPlanMonth,
  fetchTeMonthlySalesPlan,
  upsertTeMonthlySalesPlanMonth
} from "../repositories/monthlySalesPlanCorrectRepository";
import { MonthlySalesPlanCorrectMantineTable } from "./MonthlySalesPlanCorrectMantineTable";
import { MonthlySalesPlanCorrectNoteModal } from "./MonthlySalesPlanCorrectNoteModal";
import {
  applyReferenceSalesSizes,
  buildBomByParent,
  buildItemLookup,
  currentYearMonthValue,
  enrichMonthlySalesPlanRow,
  parseYearMonthValue,
  withRemarks,
  withSalesSize,
  type MonthlySalesPlanRow
} from "./types";
import "./styles.css";
import "./monthlySalesPlanCorrectTable.css";

export default function MonthlySalesPlanCorrectPage() {
  const loadingMaster = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(monthlySalesPlanCorrectMasterErrorAtom);
  const items = useAtomValue(masterTrItemsAtom);
  const cache = useAtomValue(masterEntityCacheAtom);

  const [yearMonth, setYearMonth] = useState(currentYearMonthValue);
  const [refYearMonth, setRefYearMonth] = useState("");
  const [rows, setRows] = useState<MonthlySalesPlanRow[]>([]);
  const [fetched, setFetched] = useState(false);
  const [fromDb, setFromDb] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [noteRow, setNoteRow] = useState<MonthlySalesPlanRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const itemByNo = useMemo(() => buildItemLookup(items), [items]);
  const bomByParent = useMemo(() => buildBomByParent(cache.tr_item_bom), [cache.tr_item_bom]);
  const salesPlanItems = cache.tr_sales_plan_item;

  const parsedYm = parseYearMonthValue(yearMonth);
  const canFetch = parsedYm != null && !busy;
  const canRegister = fetched && rows.length > 0 && !busy;
  const canDelete = fetched && fromDb && !busy;
  const canUseReference = fetched && !fromDb && !busy;

  const hint = useMemo(() => {
    if (!fetched) {
      return "指定年月を選んで「取得」を押してください";
    }
    const count = rows.length.toLocaleString("ja-JP");
    if (fromDb) {
      return `該当年月の登録データ ${count} 件`;
    }
    return `該当年月の登録がないため、販売計画商品マスタから作成しています（${count} 件）`;
  }, [fetched, fromDb, rows.length]);

  const handleYearMonthChange = (value: string) => {
    setYearMonth(value);
    setRows([]);
    setFetched(false);
    setFromDb(false);
    setSelectedRowId(null);
    setNoteRow(null);
    setActionError("");
  };

  const handleRowSelect = useCallback((row: MonthlySalesPlanRow) => {
    setSelectedRowId(row.id);
  }, []);

  const handleSalesSizeChange = useCallback((rowId: string, salesSize: number) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? withSalesSize(row, salesSize) : row)));
  }, []);

  const persistMonthRows = async (nextRows: MonthlySalesPlanRow[]) => {
    if (!fromDb) return;
    const ym = parseYearMonthValue(yearMonth);
    if (!ym) throw new Error("指定年月を入力してください");
    await upsertTeMonthlySalesPlanMonth(
      ym.year,
      ym.month,
      nextRows.map((r) => ({
        item_no: r.itemNo,
        item_name: r.itemName,
        sales_size: r.salesSize,
        remarks: r.remarks.trim() ? r.remarks : null
      }))
    );
  };

  const applyRemarksToNoteRow = async (remarks: string) => {
    if (!noteRow) return;
    const next = rows.map((row) => (row.id === noteRow.id ? withRemarks(row, remarks) : row));
    await persistMonthRows(next);
    setRows(next);
    setNoteRow(null);
  };

  const handleNoteClick = useCallback((row: MonthlySalesPlanRow) => {
    setActionError("");
    setNoteRow(row);
  }, []);

  const handleFetch = async () => {
    setActionError("");
    const ym = parseYearMonthValue(yearMonth);
    if (!ym) {
      setActionError("指定年月を入力してください");
      return;
    }
    setBusy(true);
    try {
      const records = await fetchTeMonthlySalesPlan(ym.year, ym.month);
      if (records.length > 0) {
        const next = records.map((r) =>
          enrichMonthlySalesPlanRow(
            {
              year: r.year,
              month: r.month,
              itemNo: r.item_no,
              itemName: r.item_name ?? "",
              salesSize: r.sales_size ?? 0,
              remarks: r.remarks ?? ""
            },
            itemByNo,
            bomByParent
          )
        );
        next.sort((a, b) => a.itemNo - b.itemNo);
        setRows(next);
        setFromDb(true);
      } else {
        const mapped: MonthlySalesPlanRow[] = [];
        const planRows = [...salesPlanItems].sort((a, b) => {
          const ao = a.data.display_order ?? 0;
          const bo = b.data.display_order ?? 0;
          return ao - bo || (a.data.item_no ?? 0) - (b.data.item_no ?? 0);
        });
        for (const entity of planRows) {
          const itemNo = entity.data.item_no;
          if (itemNo == null) continue;
          mapped.push(
            enrichMonthlySalesPlanRow(
              {
                year: ym.year,
                month: ym.month,
                itemNo,
                itemName: "",
                salesSize: 0,
                remarks: entity.data.remarks ?? ""
              },
              itemByNo,
              bomByParent
            )
          );
        }
        setRows(mapped);
        setFromDb(false);
      }
      setFetched(true);
      setSelectedRowId(null);
      setNoteRow(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setActionError("");
    const ym = parseYearMonthValue(yearMonth);
    if (!ym) {
      setActionError("指定年月を入力してください");
      return;
    }
    if (rows.length === 0) {
      setActionError("登録する明細がありません");
      return;
    }
    if (!window.confirm("該当年月の月次販売計画を登録します。よろしいですか？")) return;
    setBusy(true);
    try {
      await upsertTeMonthlySalesPlanMonth(
        ym.year,
        ym.month,
        rows.map((r) => ({
          item_no: r.itemNo,
          item_name: r.itemName,
          sales_size: r.salesSize,
          remarks: r.remarks.trim() ? r.remarks : null
        }))
      );
      setFromDb(true);
      window.alert("月次販売計画の登録が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionError("");
    const ym = parseYearMonthValue(yearMonth);
    if (!ym) {
      setActionError("指定年月を入力してください");
      return;
    }
    if (!fromDb) {
      setActionError("該当年月の登録データがないため削除できません");
      return;
    }
    if (!window.confirm("該当年月の月次販売計画を削除してもいいですか")) return;
    setBusy(true);
    try {
      await deleteTeMonthlySalesPlanMonth(ym.year, ym.month);
      setRows([]);
      setFetched(false);
      setFromDb(false);
      setSelectedRowId(null);
      setNoteRow(null);
      window.alert("月次販売計画の削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceFromReference = async () => {
    setActionError("");
    if (!canUseReference) {
      setActionError("該当年月が未登録のときのみ差替できます");
      return;
    }
    const refYm = parseYearMonthValue(refYearMonth);
    if (!refYm) {
      setActionError("参照年月を入力してください");
      return;
    }
    setBusy(true);
    try {
      const records = await fetchTeMonthlySalesPlan(refYm.year, refYm.month);
      if (records.length === 0) {
        setActionError("参照年月の該当データがありません");
        return;
      }
      setRows((prev) => applyReferenceSalesSizes(prev, records));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page monthlySalesPlanCorrectPage">
      <header className="toolbar">
        <h1 className="title">月次販売計画</h1>
        <p className="monthlySalesPlanCorrectHint">{hint}</p>
      </header>

      {loadingMaster ? <p className="status">マスタ読み込み中...</p> : null}
      {masterError ? <p className="status error">{masterError}</p> : null}
      {actionError ? (
        <p className="status error" role="alert">
          {actionError}
        </p>
      ) : null}

      <nav className="monthlySalesPlanCorrectMenuRow" aria-label="月次販売計画操作">
        <label className="monthlySalesPlanCorrectYearMonth">
          <span className="monthlySalesPlanCorrectYearMonthLabel">指定年月</span>
          <input
            className="monthlySalesPlanCorrectYearMonthInput"
            type="month"
            value={yearMonth}
            disabled={busy}
            onChange={(e) => handleYearMonthChange(e.target.value)}
            aria-label="指定年月"
          />
        </label>
        <button
          type="button"
          className="monthlySalesPlanCorrectMenuItem"
          disabled={!canFetch}
          onClick={() => void handleFetch()}
          title="指定年月の月次販売計画を取得"
        >
          取得
        </button>
        <button
          type="button"
          className="monthlySalesPlanCorrectMenuItem"
          disabled={!canRegister}
          onClick={() => void handleRegister()}
          title={
            canRegister
              ? "一覧の内容で月次販売計画を登録または更新"
              : "取得後に登録できます"
          }
        >
          登録
        </button>
        <button
          type="button"
          className="monthlySalesPlanCorrectMenuItem"
          disabled={!canDelete}
          onClick={() => void handleDelete()}
          title={
            canDelete
              ? "該当年月の月次販売計画を削除"
              : fromDb
                ? "削除するデータを取得してください"
                : "該当年月の登録データがある場合のみ削除できます"
          }
        >
          削除
        </button>
        <label className="monthlySalesPlanCorrectYearMonth monthlySalesPlanCorrectRefYearMonth">
          <span className="monthlySalesPlanCorrectYearMonthLabel">参照年月</span>
          <input
            className="monthlySalesPlanCorrectYearMonthInput"
            type="month"
            value={refYearMonth}
            disabled={!canUseReference}
            onChange={(e) => {
              setRefYearMonth(e.target.value);
              setActionError("");
            }}
            aria-label="参照年月"
          />
        </label>
        <button
          type="button"
          className="monthlySalesPlanCorrectMenuItem"
          disabled={!canUseReference}
          onClick={() => void handleReplaceFromReference()}
          title={
            canUseReference
              ? "参照年月の販売数で一覧を上書き"
              : "該当年月が未登録のときのみ差替できます"
          }
        >
          差替
        </button>
      </nav>

      <h2 className="monthlySalesPlanCorrectListTitle">販売計画一覧</h2>
      <section className="tableWrap" aria-label="販売計画一覧">
        <MantineZoomProvider>
          <MonthlySalesPlanCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            onSalesSizeChange={handleSalesSizeChange}
            onNoteClick={handleNoteClick}
            fetched={fetched}
            busy={busy || noteRow != null}
          />
        </MantineZoomProvider>
      </section>

      <MonthlySalesPlanCorrectNoteModal
        open={noteRow != null}
        row={noteRow}
        busy={busy}
        onRegister={(remarks) => applyRemarksToNoteRow(remarks)}
        onDelete={() => applyRemarksToNoteRow("")}
        onClose={() => setNoteRow(null)}
      />
    </main>
  );
}
