/**
 * 原料一覧 Mantine Table（ページングなし・件数検証用）
 */
import { memo, useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { TeMaterial } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = String(Number(ymdMatch[2])).padStart(2, "0");
    const dd = String(Number(ymdMatch[3])).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

const toNumberText = (value: number | null) => (value == null ? "" : numberFormatter.format(value));

export function materialRowId(row: TeMaterial): string {
  return `${row.materialNo ?? "material"}-${row.purchaseNo ?? ""}-${row.updateTime ?? ""}`;
}

const COLUMNS: MantineScrollTableColumn<TeMaterial>[] = [
  {
    key: "materialNo",
    label: "原料No",
    align: "center",
    sortValue: (r) => r.materialNo,
    render: (r) => (r.materialNo == null ? "" : String(r.materialNo))
  },
  {
    key: "year",
    label: "年度",
    sortValue: (r) => r.year,
    render: (r) => toNumberText(r.year)
  },
  {
    key: "purchaseDate",
    label: "仕入日",
    sortValue: (r) => r.purchaseDate ?? "",
    render: (r) => toDateText(r.purchaseDate)
  },
  {
    key: "purchaseNo",
    label: "仕入No",
    sortValue: (r) => r.purchaseNo ?? "",
    render: (r) => r.purchaseNo ?? ""
  },
  {
    key: "purchase",
    label: "仕入先",
    sortValue: (r) => r.purchase ?? "",
    render: (r) => r.purchase ?? ""
  },
  {
    key: "producer",
    label: "生産者",
    sortValue: (r) => r.producer ?? "",
    render: (r) => r.producer ?? ""
  },
  {
    key: "cost",
    label: "原価",
    align: "center",
    sortValue: (r) => r.cost,
    render: (r) => toNumberText(r.cost)
  },
  {
    key: "materialName",
    label: "原料名",
    sortValue: (r) => r.materialName ?? "",
    render: (r) => r.materialName ?? ""
  },
  {
    key: "unitWeight",
    label: "梱包重量",
    align: "center",
    sortValue: (r) => r.unitWeight,
    render: (r) => toNumberText(r.unitWeight)
  },
  {
    key: "unitNumber",
    label: "梱包数",
    align: "center",
    sortValue: (r) => r.unitNumber,
    render: (r) => toNumberText(r.unitNumber)
  },
  {
    key: "fractionWeight",
    label: "端数重量",
    sortValue: (r) => r.fractionWeight,
    render: (r) => toNumberText(r.fractionWeight)
  },
  {
    key: "remarks",
    label: "摘要",
    sortValue: (r) => r.remarks ?? "",
    render: (r) => r.remarks ?? ""
  }
];

type Props = {
  rows: TeMaterial[];
  searchExecuted?: boolean;
};

export const MaterialListMantineTable = memo(function MaterialListMantineTable({
  rows,
  searchExecuted = true
}: Props) {
  const columns = useMemo(() => COLUMNS, []);

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={materialRowId}
      columns={columns}
      pagination={listTablePagination.materialList}
      minTableWidth={1280}
      showFilter={false}
      emptyMessage={emptyMessage}
      className="materialListMantineTableRoot"
      scrollClassName="materialListMantineScroll mantineScrollTableScroll"
      tableClassName="materialListMantineTable mantineScrollTable"
    />
  );
});
