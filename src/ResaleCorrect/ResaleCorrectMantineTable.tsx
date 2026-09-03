/**
 * 転売先マスタ一覧 Mantine Table（ResaleCorrect MainWindow DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { ResaleCorrectRow } from "./types";
import "./resaleCorrectTable.css";

const intFormatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

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
  rows: ResaleCorrectRow[];
  selectedRowId: string | null;
  onRowSelect: (row: ResaleCorrectRow) => void;
  searchExecuted?: boolean;
};

export const ResaleCorrectMantineTable = memo(function ResaleCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted = true
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<ResaleCorrectRow>[]>(
    () => [
      {
        key: "resale",
        label: "転売先",
        width: 150,
        sortValue: (r) => r.resale,
        render: (r) => r.resale
      },
      {
        key: "rate",
        label: "手数料%",
        align: "right",
        width: 70,
        sortValue: (r) => r.rate,
        render: (r) => intFormatter.format(r.rate)
      },
      {
        key: "postage",
        label: "送料",
        align: "right",
        width: 70,
        sortValue: (r) => r.postage,
        render: (r) => intFormatter.format(r.postage)
      },
      {
        key: "limitPrice",
        label: "下限額",
        align: "right",
        width: 80,
        sortValue: (r) => r.limitPrice,
        render: (r) => intFormatter.format(r.limitPrice)
      },
      {
        key: "fixedPrice",
        label: "固定額",
        align: "right",
        width: 80,
        sortValue: (r) => r.fixedPrice,
        render: (r) => intFormatter.format(r.fixedPrice)
      },
      {
        key: "calcType",
        label: multilineHeader("計算", "区分"),
        align: "right",
        width: 50,
        sortValue: (r) => r.calcType,
        render: (r) => String(r.calcType)
      },
      {
        key: "remarks",
        label: "摘要",
        width: 200,
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ],
    []
  );

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.resaleCorrect}
      minTableWidth={720}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="resaleCorrectMantineRoot"
      scrollClassName="resaleCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="resaleCorrectMantineTable mantineScrollTable"
    />
  );
});
