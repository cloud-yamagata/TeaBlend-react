/**
 * 商品マスタ一覧 Mantine Table（ItemCorrect MainWindow DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { ItemCorrectRow } from "./types";
import "./itemCorrectTable.css";

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
  rows: ItemCorrectRow[];
  selectedRowId: string | null;
  onRowSelect: (row: ItemCorrectRow) => void;
  searchExecuted?: boolean;
};

export const ItemCorrectMantineTable = memo(function ItemCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted = true
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<ItemCorrectRow>[]>(
    () => [
      {
        key: "itemNo",
        label: multilineHeader("商品", "No"),
        align: "right",
        width: 50,
        sortValue: (r) => r.itemNo,
        render: (r) => String(r.itemNo)
      },
      {
        key: "systemClass",
        label: multilineHeader("商品", "区分"),
        width: 50,
        sortValue: (r) => r.systemClass,
        render: (r) => r.systemClass
      },
      {
        key: "organicClass",
        label: multilineHeader("有機", "区分"),
        width: 50,
        sortValue: (r) => r.organicClass,
        render: (r) => r.organicClass
      },
      {
        key: "itemGroupNo",
        label: multilineHeader("商品", "分類"),
        align: "right",
        width: 50,
        sortValue: (r) => r.itemGroupNo,
        render: (r) => intFormatter.format(r.itemGroupNo)
      },
      {
        key: "itemName",
        label: "商品名",
        width: 280,
        sortValue: (r) => r.itemName,
        render: (r) => r.itemName
      },
      {
        key: "janCode",
        label: "JANコード",
        width: 130,
        sortValue: (r) => r.janCode,
        render: (r) => r.janCode
      },
      {
        key: "packageSize",
        label: multilineHeader("梱包", "サイズ"),
        align: "right",
        width: 50,
        sortValue: (r) => r.packageSize,
        render: (r) => intFormatter.format(r.packageSize)
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
        label: "備考",
        width: 180,
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
      pagination={listTablePagination.itemCorrect}
      minTableWidth={1000}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="itemCorrectMantineRoot"
      scrollClassName="itemCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="itemCorrectMantineTable mantineScrollTable"
    />
  );
});
