/**
 * パッケージロット登録 … 製造報告書一覧（MainWindow.xaml DataGrid 列相当）
 */
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { PackageLotRegistRow } from "./types";
import "./packageLotRegistTable.css";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const toNumberText = (value: number | null, fractionDigits?: number): string => {
  if (value == null || !Number.isFinite(value)) return "";
  if (fractionDigits != null) return value.toFixed(fractionDigits);
  return numberFormatter.format(value);
};

type Props = {
  rows: PackageLotRegistRow[];
  selectedRowId: string | null;
  onRowSelect: (row: PackageLotRegistRow) => void;
  searchExecuted: boolean;
};

export function PackageLotRegistTable({ rows, selectedRowId, onRowSelect, searchExecuted }: Props) {
  const columns = useMemo((): MantineScrollTableColumn<PackageLotRegistRow>[] => {
    return [
      {
        key: "workDate",
        label: "製造日",
        sortValue: (r) => r.workDate ?? "",
        render: (r) => toDateText(r.workDate)
      },
      {
        key: "lotStatus",
        label: "ロット状態",
        align: "center",
        sortValue: (r) => r.lotStatus,
        render: (r) => r.lotStatus
      },
      {
        key: "productNo",
        label: "製造No",
        align: "right",
        sortValue: (r) => r.productNo,
        render: (r) => (r.productNo != null ? String(r.productNo) : "")
      },
      {
        key: "itemNo",
        label: "商品No",
        align: "right",
        sortValue: (r) => r.itemNo,
        render: (r) => toNumberText(r.itemNo)
      },
      {
        key: "organicName",
        label: "茶区分",
        align: "center",
        sortValue: (r) => r.organicName,
        render: (r) => r.organicName
      },
      {
        key: "productName",
        label: "商品名",
        sortValue: (r) => r.productName,
        render: (r) => r.productName
      },
      {
        key: "completeQuantity",
        label: "生産量",
        align: "right",
        sortValue: (r) => r.completeQuantity,
        render: (r) => toNumberText(r.completeQuantity)
      },
      {
        key: "gradeNo",
        label: "格付No",
        align: "right",
        sortValue: (r) => r.gradeNo,
        render: (r) => toNumberText(r.gradeNo)
      },
      {
        key: "partName",
        label: "使用部品名",
        sortValue: (r) => r.partName,
        render: (r) => r.partName
      },
      {
        key: "useQuantity",
        label: "使用量",
        align: "right",
        sortValue: (r) => r.useQuantity,
        render: (r) => toNumberText(r.useQuantity, 2)
      }
    ];
  }, []);

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.packageLotRegist}
      minTableWidth={1000}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      striped={false}
      highlightOnHover
      className="pkgLotRegistMantineRoot"
      scrollClassName="pkgLotRegistMantineScroll mantineScrollTableScroll"
      tableClassName="pkgLotRegistMantineTable mantineScrollTable"
    />
  );
}
