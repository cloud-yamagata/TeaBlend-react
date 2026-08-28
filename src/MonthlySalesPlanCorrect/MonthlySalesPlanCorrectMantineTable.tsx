/**
 * 月次販売計画一覧
 */
import { memo, useMemo, type ReactNode } from "react";
import { IconNotebook } from "@tabler/icons-react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import { hasRemarks, type MonthlySalesPlanRow } from "./types";
import "./monthlySalesPlanCorrectTable.css";

const intFormatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const kgFormatter = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3
});

const multilineHeader = (line1: string, line2?: string): ReactNode => (
  <span className="mantineScrollTableHeaderMultiline">
    {line1}
    {line2 ? (
      <>
        <br />
        {line2}
      </>
    ) : null}
  </span>
);

type Props = {
  rows: MonthlySalesPlanRow[];
  selectedRowId: string | null;
  onRowSelect: (row: MonthlySalesPlanRow) => void;
  onSalesSizeChange: (rowId: string, salesSize: number) => void;
  onNoteClick: (row: MonthlySalesPlanRow) => void;
  fetched: boolean;
  busy: boolean;
};

export const MonthlySalesPlanCorrectMantineTable = memo(function MonthlySalesPlanCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  onSalesSizeChange,
  onNoteClick,
  fetched,
  busy
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<MonthlySalesPlanRow>[]>(
    () => [
      {
        key: "year",
        label: "年",
        align: "center",
        width: 70,
        sortValue: (r) => r.year,
        render: (r) => String(r.year)
      },
      {
        key: "month",
        label: "月",
        align: "center",
        width: 50,
        sortValue: (r) => r.month,
        render: (r) => String(r.month)
      },
      {
        key: "itemNo",
        label: multilineHeader("商品", "No"),
        align: "right",
        width: 70,
        sortValue: (r) => r.itemNo,
        render: (r) => String(r.itemNo)
      },
      {
        key: "itemName",
        label: "商品名",
        width: 220,
        sortValue: (r) => r.itemName,
        render: (r) => r.itemName
      },
      {
        key: "salesSize",
        label: "販売数",
        align: "right",
        width: 90,
        sortValue: (r) => r.salesSize,
        render: (r) => (
          <input
            className="monthlySalesPlanCorrectSalesInput"
            type="text"
            inputMode="numeric"
            value={String(r.salesSize)}
            disabled={busy}
            aria-label={`${r.itemName}の販売数`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              onSalesSizeChange(r.id, digits === "" ? 0 : Number(digits));
            }}
          />
        )
      },
      {
        key: "finishItemNo",
        label: multilineHeader("仕上茶", "No"),
        align: "right",
        width: 80,
        sortValue: (r) => r.finishItemNo ?? 0,
        render: (r) => (r.finishItemNo == null ? "" : String(r.finishItemNo))
      },
      {
        key: "finishItemName",
        label: "仕上茶名",
        width: 200,
        sortValue: (r) => r.finishItemName,
        render: (r) => r.finishItemName
      },
      {
        key: "packageSize",
        label: multilineHeader("梱包サイズ", "(g)"),
        align: "right",
        width: 90,
        sortValue: (r) => r.packageSize,
        render: (r) => intFormatter.format(r.packageSize)
      },
      {
        key: "needSize",
        label: multilineHeader("必要量", "(kg)"),
        align: "right",
        width: 90,
        sortValue: (r) => r.needSize,
        render: (r) => kgFormatter.format(r.needSize)
      },
      {
        key: "note",
        label: "ノート",
        align: "center",
        width: 56,
        sortable: false,
        render: (r) => {
          const filled = hasRemarks(r.remarks);
          return (
            <button
              type="button"
              className={`monthlySalesPlanCorrectNoteBtn${filled ? " hasNote" : ""}`}
              disabled={busy}
              title={filled ? "ノートあり" : "ノートなし"}
              aria-label={filled ? `${r.itemName}のノート（記入あり）` : `${r.itemName}のノート`}
              onClick={(e) => {
                e.stopPropagation();
                onNoteClick(r);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <IconNotebook size={20} stroke={filled ? 1.2 : 1.6} fill={filled ? "currentColor" : "none"} />
            </button>
          );
        }
      }
    ],
    [busy, onNoteClick, onSalesSizeChange]
  );

  const emptyMessage = fetched
    ? "表示するデータがありません"
    : "指定年月を選んで「取得」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.monthlySalesPlanCorrect}
      minTableWidth={1080}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="monthlySalesPlanCorrectMantineRoot"
      scrollClassName="monthlySalesPlanCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="monthlySalesPlanCorrectMantineTable mantineScrollTable"
    />
  );
});
