/**
 * 配合個別情報登録 … メイン一覧（Mantine Table）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { BlendCategoryRow } from "./types";
import "./blendCategorysTable.css";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const toNumberText = (value: number | null): string => (value == null ? "" : numberFormatter.format(value));

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

const COLUMNS: MantineScrollTableColumn<BlendCategoryRow>[] = [
  {
    key: "workDate",
    label: "製造日",
    sortValue: (r) => r.workDate ?? "",
    render: (r) => toDateText(r.workDate)
  },
  {
    key: "lotNo",
    label: multilineHeader("ロット", "No"),
    sortValue: (r) => (r.lotNo == null ? "" : String(r.lotNo)),
    render: (r) => (r.lotNo == null ? "" : String(r.lotNo))
  },
  {
    key: "processTypeName",
    label: multilineHeader("工程", "区分"),
    sortValue: (r) => r.processTypeName ?? "",
    render: (r) => r.processTypeName ?? ""
  },
  {
    key: "productNo",
    label: multilineHeader("製造", "No"),
    sortValue: (r) => (r.productNo == null ? "" : String(r.productNo)),
    render: (r) => (r.productNo == null ? "" : String(r.productNo))
  },
  {
    key: "lotStatusName",
    label: multilineHeader("ロット", "状態"),
    sortValue: (r) => r.lotStatusName ?? "",
    render: (r) => r.lotStatusName ?? ""
  },
  {
    key: "lotName",
    label: "ロット名",
    sortValue: (r) => r.lotName ?? "",
    render: (r) => r.lotName ?? ""
  },
  {
    key: "makeYear",
    label: multilineHeader("年", "度"),
    align: "center",
    sortValue: (r) => r.makeYear,
    render: (r) => toNumberText(r.makeYear)
  },
  {
    key: "itemName",
    label: "通称名",
    sortValue: (r) => r.itemName ?? "",
    render: (r) => r.itemName ?? ""
  },
  {
    key: "count",
    label: multilineHeader("回", "数"),
    align: "center",
    sortValue: (r) => r.count,
    render: (r) => toNumberText(r.count)
  },
  {
    key: "organicClass",
    label: multilineHeader("有機", "区分"),
    sortValue: (r) => r.organicClass ?? "",
    render: (r) => r.organicClass ?? ""
  },
  {
    key: "unitWeight",
    label: multilineHeader("梱包", "重量"),
    align: "right",
    sortValue: (r) => r.unitWeight,
    render: (r) => toNumberText(r.unitWeight)
  },
  {
    key: "unitNumber",
    label: multilineHeader("梱包", "数"),
    align: "right",
    sortValue: (r) => r.unitNumber,
    render: (r) => toNumberText(r.unitNumber)
  },
  {
    key: "fractionWeight",
    label: multilineHeader("端数", "重量"),
    align: "right",
    sortValue: (r) => r.fractionWeight,
    render: (r) => (r.fractionWeight == null ? "" : r.fractionWeight.toFixed(2))
  }
];

type Props = {
  rows: BlendCategoryRow[];
  selectedRowId: string | null;
  onRowSelect: (row: BlendCategoryRow) => void;
  searchExecuted?: boolean;
};

export const BlendCategorysMantineTable = memo(function BlendCategorysMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted = true
}: Props) {
  const columns = useMemo(() => COLUMNS, []);

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.blendCategorys}
      minTableWidth={1100}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="blendCategoryMantineRoot"
      scrollClassName="blendCategoryMantineScroll mantineScrollTableScroll"
      tableClassName="blendCategoryMantineTable mantineScrollTable"
    />
  );
});
