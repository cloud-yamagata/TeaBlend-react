/**
 * 仕上品受入一覧 Mantine Table（WPF MainWindow DataGrid 相当）
 */
import { memo, useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { PartsReceiveRow } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}/${String(Number(ymdMatch[2])).padStart(2, "0")}/${String(Number(ymdMatch[3])).padStart(2, "0")}`;
  }
  return value;
};

const toNumberText = (value: number) => (Number.isFinite(value) ? numberFormatter.format(value) : "");

type Props = {
  rows: PartsReceiveRow[];
  selectedRowId: string | null;
  onRowSelect: (row: PartsReceiveRow) => void;
  searchExecuted: boolean;
  emptyMessage?: string;
};

const COLUMNS: MantineScrollTableColumn<PartsReceiveRow>[] = [
  {
    key: "productDate",
    label: "製造日",
    sortValue: (r) => r.productDate ?? "",
    render: (r) => toDateText(r.productDate)
  },
  {
    key: "itemNo",
    label: "商品No",
    align: "right",
    sortValue: (r) => r.itemNo,
    render: (r) => String(r.itemNo)
  },
  {
    key: "productNo",
    label: "製造No",
    align: "right",
    sortValue: (r) => r.productNo,
    render: (r) => String(r.productNo)
  },
  {
    key: "itemName",
    label: "商品名",
    sortValue: (r) => r.itemName,
    render: (r) => r.itemName
  },
  {
    key: "makeYear",
    label: "年",
    align: "right",
    sortValue: (r) => r.makeYear,
    render: (r) => r.makeYear
  },
  {
    key: "count",
    label: "回数",
    align: "right",
    sortValue: (r) => r.count,
    render: (r) => r.count
  },
  {
    key: "productQuantity",
    label: "生産量",
    align: "right",
    sortValue: (r) => r.productQuantity,
    render: (r) => toNumberText(r.productQuantity)
  },
  {
    key: "factory2Stock",
    label: "第2工場在庫",
    align: "right",
    sortValue: (r) => r.factory2Stock,
    render: (r) => toNumberText(r.factory2Stock)
  },
  {
    key: "factory3Stock",
    label: "第3工場在庫",
    align: "right",
    sortValue: (r) => r.factory3Stock,
    render: (r) => toNumberText(r.factory3Stock)
  }
];

export const PartsReceiveMantineTable = memo(function PartsReceiveMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted,
  emptyMessage
}: Props) {
  const columns = useMemo(() => COLUMNS, []);
  const resolvedEmptyMessage =
    emptyMessage ??
    (searchExecuted
      ? "条件に一致する仕上茶在庫はありません"
      : "「実行」でマスタを取得します。条件指定後は「抽出」で絞り込んでください。");

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.partsReceive}
      minTableWidth={980}
      showFilter={false}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      emptyMessage={resolvedEmptyMessage}
      striped={false}
      highlightOnHover
      className="materialPurchaseMantineTableRoot"
      scrollClassName="materialPurchaseMantineScroll mantineScrollTableScroll"
      tableClassName="materialPurchaseMantineTable mantineScrollTable"
    />
  );
});
