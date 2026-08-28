/**
 * 販売計画商品マスタ一覧
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { SalesPlanItemCorrectRow } from "./types";
import "./salesPlanItemCorrectTable.css";

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
  rows: SalesPlanItemCorrectRow[];
  selectedRowId: string | null;
  onRowSelect: (row: SalesPlanItemCorrectRow) => void;
  searchExecuted?: boolean;
};

export const SalesPlanItemCorrectMantineTable = memo(function SalesPlanItemCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted = true
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<SalesPlanItemCorrectRow>[]>(
    () => [
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
        width: 280,
        sortValue: (r) => r.itemName,
        render: (r) => r.itemName
      },
      {
        key: "packageSize",
        label: multilineHeader("梱包", "サイズ"),
        align: "right",
        width: 80,
        sortValue: (r) => r.packageSize,
        render: (r) => intFormatter.format(r.packageSize)
      },
      {
        key: "itemGroupName",
        label: "商品分類名",
        width: 140,
        sortValue: (r) => r.itemGroupName,
        render: (r) => r.itemGroupName
      },
      {
        key: "displayOrder",
        label: multilineHeader("表示", "順"),
        align: "right",
        width: 50,
        sortValue: (r) => r.displayOrder,
        render: (r) => intFormatter.format(r.displayOrder)
      },
      {
        key: "display",
        label: "表示",
        align: "center",
        width: 50,
        sortable: false,
        render: (r) => (
          <input type="checkbox" checked={r.display} readOnly tabIndex={-1} aria-label="表示" />
        )
      },
      {
        key: "remarks",
        label: "摘要",
        width: 220,
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
      pagination={listTablePagination.salesPlanItemCorrect}
      minTableWidth={960}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="salesPlanItemCorrectMantineRoot"
      scrollClassName="salesPlanItemCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="salesPlanItemCorrectMantineTable mantineScrollTable"
    />
  );
});
