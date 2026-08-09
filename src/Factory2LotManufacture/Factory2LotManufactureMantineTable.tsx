/**
 * 第2工場ロット製造 … メイン一覧（Mantine Table）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { Factory2LotRow } from "./types";
import "./factory2LotManufactureTable.css";

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

const COLUMNS: MantineScrollTableColumn<Factory2LotRow>[] = [
  {
    key: "workDate",
    label: "製造日",
    sortValue: (r) => r.workDate ?? "",
    render: (r) => toDateText(r.workDate)
  },
  {
    key: "lotNo",
    label: multilineHeader("ロット", "No"),
    align: "right",
    sortValue: (r) => r.lotNo,
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
    align: "right",
    sortValue: (r) => r.productNo,
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
  },
  {
    key: "remarks",
    label: "摘要",
    sortValue: (r) => r.remarks ?? "",
    render: (r) => r.remarks ?? ""
  }
];

type Props = {
  rows: Factory2LotRow[];
  loading?: boolean;
  selectedRowId: string | null;
  onRowSelect: (row: Factory2LotRow) => void;
  searchExecuted: boolean;
};

export const Factory2LotManufactureMantineTable = memo(function Factory2LotManufactureMantineTable({
  rows,
  loading = false,
  selectedRowId,
  onRowSelect,
  searchExecuted
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
      pagination={listTablePagination.factory2LotManufacture}
      minTableWidth={1180}
      showFilter={false}
      loading={loading}
      loadingMessage="マスタ読込中…"
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      striped={false}
      highlightOnHover
      className="factory2LotMantineRoot"
      scrollClassName="factory2LotMantineScroll mantineScrollTableScroll"
      tableClassName="factory2LotMantineTable mantineScrollTable"
    />
  );
});
