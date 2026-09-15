/**
 * ロット分割一覧 Mantine Table
 */
import { memo, useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { LotDivideRow } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

type Props = {
  rows: LotDivideRow[];
  selectedRowId: string | null;
  onRowSelect: (row: LotDivideRow) => void;
  searchExecuted: boolean;
};

const COLUMNS: MantineScrollTableColumn<LotDivideRow>[] = [
  {
    key: "productDate",
    label: "製造日",
    sortValue: (r) => r.productDate ?? "",
    render: (r) => toDateText(r.productDate)
  },
  {
    key: "lotNo",
    label: "ロットNo",
    align: "right",
    sortValue: (r) => r.lotNo,
    render: (r) => String(r.lotNo)
  },
  {
    key: "processTypeName",
    label: "工程区分",
    sortValue: (r) => r.processType,
    render: (r) => r.processTypeName
  },
  {
    key: "productNo",
    label: "製造No",
    align: "right",
    sortValue: (r) => r.productNo,
    render: (r) => String(r.productNo)
  },
  {
    key: "lotName",
    label: "ロット名",
    sortValue: (r) => r.lotName,
    render: (r) => r.lotName
  },
  {
    key: "makeYear",
    label: "年度",
    align: "right",
    sortValue: (r) => r.makeYear,
    render: (r) => r.makeYear
  },
  {
    key: "itemName",
    label: "通称名",
    sortValue: (r) => r.itemName,
    render: (r) => r.itemName
  },
  {
    key: "count",
    label: "回数",
    align: "right",
    sortValue: (r) => r.count,
    render: (r) => r.count
  },
  {
    key: "organicClass",
    label: "有機区分",
    sortValue: (r) => r.organicClass,
    render: (r) => r.organicClass
  },
  {
    key: "productQuantity",
    label: "生産重量",
    align: "right",
    sortValue: (r) => r.productQuantity,
    render: (r) => numberFormatter.format(r.productQuantity)
  },
  {
    key: "factory2Stock",
    label: "在庫重量",
    align: "right",
    sortValue: (r) => r.factory2Stock,
    render: (r) => numberFormatter.format(r.factory2Stock)
  },
  {
    key: "divideQuantity",
    label: "分割重量",
    align: "right",
    sortValue: (r) => r.divideQuantity,
    render: (r) => numberFormatter.format(r.divideQuantity)
  }
];

export const LotDivideMantineTable = memo(function LotDivideMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted
}: Props) {
  const columns = useMemo(() => COLUMNS, []);
  const emptyMessage = searchExecuted
    ? "条件に一致するロット在庫はありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.lotDivide}
      minTableWidth={1100}
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
