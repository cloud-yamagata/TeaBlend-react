/**
 * 仕上品仕入一覧 Mantine Table（MaterialList パターン）
 */
import { memo, useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { MaterialPurchaseRow } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}/${String(Number(ymdMatch[2])).padStart(2, "0")}/${String(Number(ymdMatch[3])).padStart(2, "0")}`;
  }
  return value;
};

const toNumberText = (value: number | null) => (value == null ? "" : numberFormatter.format(value));

type Props = {
  rows: MaterialPurchaseRow[];
  selectedRowId: string | null;
  onRowSelect: (row: MaterialPurchaseRow) => void;
  searchExecuted: boolean;
};

const COLUMNS: MantineScrollTableColumn<MaterialPurchaseRow>[] = [
  {
    key: "purchaseDate",
    label: "仕入日",
    sortValue: (r) => r.purchaseDate ?? "",
    render: (r) => toDateText(r.purchaseDate)
  },
  {
    key: "itemNo",
    label: "商品No",
    align: "right",
    sortValue: (r) => r.itemNo,
    render: (r) => String(r.itemNo)
  },
  {
    key: "purchaseNo",
    label: "仕入No",
    align: "right",
    sortValue: (r) => r.purchaseNo,
    render: (r) => String(r.purchaseNo)
  },
  {
    key: "itemName",
    label: "商品名",
    sortValue: (r) => r.itemName,
    render: (r) => r.itemName
  },
  {
    key: "purchaseLotNo",
    label: "ロットNo",
    sortValue: (r) => r.purchaseLotNo,
    render: (r) => r.purchaseLotNo
  },
  {
    key: "purchaseQuantity",
    label: "仕入量",
    align: "right",
    sortValue: (r) => r.purchaseQuantity,
    render: (r) => toNumberText(r.purchaseQuantity)
  },
  {
    key: "supplier",
    label: "仕入先",
    sortValue: (r) => r.supplier,
    render: (r) => r.supplier
  }
];

export const MaterialPurchaseMantineTable = memo(function MaterialPurchaseMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted
}: Props) {
  const columns = useMemo(() => COLUMNS, []);
  const emptyMessage = searchExecuted
    ? "条件に一致する仕入実績はありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.materialPurchase}
      minTableWidth={980}
      showFilter={false}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      emptyMessage={emptyMessage}
      striped={false}
      highlightOnHover
      className="materialPurchaseMantineTableRoot"
      scrollClassName="materialPurchaseMantineScroll mantineScrollTableScroll"
      tableClassName="materialPurchaseMantineTable mantineScrollTable"
    />
  );
});
