/**
 * 仕入受入情報一覧 Mantine Table（PurchaseReceive MainWindow.xaml 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { PurchaseReceiveRow } from "./types";
import "./purchaseReceiveTable.css";

const intFormatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const toIntText = (value: number | null): string => (value == null ? "" : intFormatter.format(value));
const toDecimalText = (value: number | null): string => (value == null ? "" : decimalFormatter.format(value));

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

const COLUMNS: MantineScrollTableColumn<PurchaseReceiveRow>[] = [
  {
    key: "year",
    label: multilineHeader("年", "度"),
    align: "right",
    width: 30,
    sortValue: (r) => r.year,
    render: (r) => String(r.year >= 100 ? r.year % 100 : r.year)
  },
  {
    key: "bidNo",
    label: "入札NO",
    width: 80,
    sortValue: (r) => r.bidNo,
    render: (r) => r.bidNo
  },
  {
    key: "purchaseDate",
    label: "仕入日",
    width: 90,
    sortValue: (r) => r.purchaseDate,
    render: (r) => toDateText(r.purchaseDate)
  },
  {
    key: "purchase",
    label: "仕入先",
    width: 80,
    sortValue: (r) => r.purchase,
    render: (r) => r.purchase
  },
  {
    key: "variety",
    label: "品種",
    width: 50,
    sortValue: (r) => r.variety,
    render: (r) => r.variety
  },
  {
    key: "teaLife",
    label: "茶期",
    width: 50,
    sortValue: (r) => r.teaLife,
    render: (r) => r.teaLife
  },
  {
    key: "grade",
    label: "格付",
    width: 50,
    sortValue: (r) => r.grade,
    render: (r) => r.grade
  },
  {
    key: "teaType",
    label: "茶種",
    width: 50,
    sortValue: (r) => r.teaType,
    render: (r) => r.teaType
  },
  {
    key: "teaRank",
    label: "品柄",
    width: 50,
    sortValue: (r) => r.teaRank,
    render: (r) => r.teaRank
  },
  {
    key: "fieldNo",
    label: "圃場",
    width: 50,
    sortValue: (r) => r.fieldNo,
    render: (r) => r.fieldNo
  },
  {
    key: "producer",
    label: "生産者",
    width: 100,
    sortValue: (r) => r.producer,
    render: (r) => r.producer
  },
  {
    key: "unitWeight",
    label: multilineHeader("梱包", "重量"),
    align: "right",
    width: 60,
    sortValue: (r) => r.unitWeight,
    render: (r) => toDecimalText(r.unitWeight)
  },
  {
    key: "unitNumber",
    label: multilineHeader("梱包", "数"),
    align: "right",
    width: 40,
    sortValue: (r) => r.unitNumber,
    render: (r) => toIntText(r.unitNumber)
  },
  {
    key: "fractionWeight",
    label: multilineHeader("端数", "重量"),
    align: "right",
    width: 50,
    sortValue: (r) => r.fractionWeight,
    render: (r) => toDecimalText(r.fractionWeight)
  },
  {
    key: "fractionNumber",
    label: multilineHeader("端数", "数"),
    align: "right",
    width: 40,
    sortValue: (r) => r.fractionNumber,
    render: (r) => toIntText(r.fractionNumber)
  },
  {
    key: "transferQuantity",
    label: multilineHeader("移動", "重量"),
    align: "right",
    width: 60,
    sortValue: (r) => r.transferQuantity,
    render: (r) => toDecimalText(r.transferQuantity)
  },
  {
    key: "status",
    label: multilineHeader("残量", "状況"),
    width: 50,
    sortValue: (r) => r.status,
    render: (r) => r.status
  },
  {
    key: "receiveQuantity",
    label: multilineHeader("受入", "重量"),
    align: "right",
    width: 60,
    sortValue: (r) => r.receiveQuantity,
    render: (r) => toDecimalText(r.receiveQuantity)
  },
  {
    key: "target",
    label: "用途",
    width: 80,
    sortValue: (r) => r.target,
    render: (r) => r.target
  },
  {
    key: "targetPlan",
    label: multilineHeader("予定", "用途"),
    width: 80,
    sortValue: (r) => r.targetPlan,
    render: (r) => r.targetPlan
  },
  {
    key: "lotNo",
    label: multilineHeader("ロット", "NO"),
    width: 60,
    sortValue: (r) => r.lotNo,
    render: (r) => r.lotNo
  }
];

type Props = {
  rows: PurchaseReceiveRow[];
  selectedRowId: string | null;
  onRowSelect: (row: PurchaseReceiveRow) => void;
  searchExecuted?: boolean;
};

export const PurchaseReceiveMantineTable = memo(function PurchaseReceiveMantineTable({
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
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.purchaseReceive}
      minTableWidth={1800}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="purchaseReceiveMantineTableRoot"
      scrollClassName="purchaseReceiveMantineScroll mantineScrollTableScroll"
      tableClassName="purchaseReceiveMantineTable mantineScrollTable"
    />
  );
});
