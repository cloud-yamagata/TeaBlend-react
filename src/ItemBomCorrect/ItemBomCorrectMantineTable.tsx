/**
 * 商品原料対照表一覧 Mantine Table（ItemBomCorrect MainWindow DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { ItemBomCorrectRow } from "./types";
import "./itemBomCorrectTable.css";

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
  rows: ItemBomCorrectRow[];
  selectedRowId: string | null;
  onRowSelect: (row: ItemBomCorrectRow) => void;
};

export const ItemBomCorrectMantineTable = memo(function ItemBomCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<ItemBomCorrectRow>[]>(
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
        key: "organicClass",
        label: multilineHeader("有機", "区分"),
        width: 50,
        sortValue: (r) => r.organicClass,
        render: (r) => r.organicClass
      },
      {
        key: "itemName",
        label: "商品名",
        width: 300,
        sortValue: (r) => r.itemName,
        render: (r) => r.itemName
      },
      {
        key: "childItemNo",
        label: multilineHeader("原料茶", "No"),
        align: "right",
        width: 50,
        sortValue: (r) => r.childItemNo ?? -1,
        render: (r) => (r.childItemNo == null ? "" : String(r.childItemNo))
      },
      {
        key: "useOrganicClass",
        label: multilineHeader("有機", "区分"),
        width: 50,
        sortValue: (r) => r.useOrganicClass,
        render: (r) => r.useOrganicClass
      },
      {
        key: "useItemName",
        label: "原料名",
        width: 250,
        sortValue: (r) => r.useItemName,
        render: (r) => r.useItemName
      }
    ],
    []
  );

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.itemBomCorrect}
      minTableWidth={800}
      showFilter={false}
      emptyMessage="表示するデータがありません"
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="itemBomCorrectMantineRoot"
      scrollClassName="itemBomCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="itemBomCorrectMantineTable mantineScrollTable"
    />
  );
});
