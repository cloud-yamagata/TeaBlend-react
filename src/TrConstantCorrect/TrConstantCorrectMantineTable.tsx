/**
 * システム定数一覧 Mantine Table
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { trConstantPassesDisplayActive } from "../components/trConstantZoomFilter";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { TrConstantCorrectRow } from "./types";
import "./trConstantCorrectTable.css";

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

const displayLabel = (value: boolean | null): string => {
  if (value === true) return "表示";
  if (value === false) return "非表示";
  return "";
};

type Props = {
  rows: TrConstantCorrectRow[];
  selectedRowId: string | null;
  onRowSelect: (row: TrConstantCorrectRow) => void;
  listLoaded: boolean;
};

export const TrConstantCorrectMantineTable = memo(function TrConstantCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  listLoaded
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<TrConstantCorrectRow>[]>(
    () => [
      {
        key: "constValue",
        label: multilineHeader("定数", "値"),
        width: 100,
        sortValue: (r) => r.constValue,
        render: (r) => r.constValue
      },
      {
        key: "constName",
        label: "定数名",
        width: 280,
        sortValue: (r) => r.constName,
        render: (r) => r.constName
      },
      {
        key: "displayOrder",
        label: multilineHeader("表示", "順"),
        align: "right",
        width: 70,
        sortValue: (r) => r.displayOrder ?? Number.POSITIVE_INFINITY,
        render: (r) => (r.displayOrder == null ? "" : String(r.displayOrder))
      },
      {
        key: "display",
        label: "表示",
        width: 70,
        align: "center",
        sortValue: (r) => (trConstantPassesDisplayActive(r) ? 1 : 0),
        render: (r) => displayLabel(r.display)
      }
    ],
    []
  );

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.trConstantCorrect}
      minTableWidth={560}
      showFilter={false}
      emptyMessage={
        listLoaded ? "表示するデータがありません" : "定数項目を選択して「表示」を押してください"
      }
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="trConstantCorrectMantineRoot"
      scrollClassName="trConstantCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="trConstantCorrectMantineTable mantineScrollTable"
    />
  );
});
