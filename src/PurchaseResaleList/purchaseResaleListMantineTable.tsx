/**
 * 振分実績一覧 Mantine Table（PurchaseResaleList MainWindow.xaml 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { PurchaseResaleListRow } from "./types";

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

const COLUMNS: MantineScrollTableColumn<PurchaseResaleListRow>[] = [
  {
    key: "year",
    label: multilineHeader("年", "度"),
    align: "center",
    sortValue: (r) => r.year,
    render: (r) => String(r.year >= 100 ? r.year % 100 : r.year)
  },
  {
    key: "bidNo",
    label: "入札NO",
    sortValue: (r) => r.bidNo,
    render: (r) => r.bidNo
  },
  {
    key: "transferDate",
    label: "振分日",
    sortValue: (r) => r.transferDate,
    render: (r) => toDateText(r.transferDate)
  },
  {
    key: "purchase",
    label: "仕入先",
    sortValue: (r) => r.purchase,
    render: (r) => r.purchase
  },
  {
    key: "transfer",
    label: "振分先",
    sortValue: (r) => r.transfer,
    render: (r) => r.transfer
  },
  {
    key: "unitWeight",
    label: multilineHeader("梱包", "重量"),
    align: "right",
    sortValue: (r) => r.unitWeight,
    render: (r) => toDecimalText(r.unitWeight)
  },
  {
    key: "unitNumber",
    label: multilineHeader("梱包", "数"),
    align: "right",
    sortValue: (r) => r.unitNumber,
    render: (r) => toIntText(r.unitNumber)
  },
  {
    key: "fractionWeight",
    label: multilineHeader("端数", "重量"),
    align: "right",
    sortValue: (r) => r.fractionWeight,
    render: (r) => toDecimalText(r.fractionWeight)
  },
  {
    key: "fractionNumber",
    label: multilineHeader("端数", "数"),
    align: "right",
    sortValue: (r) => r.fractionNumber,
    render: (r) => toIntText(r.fractionNumber)
  },
  {
    key: "transferWeight",
    label: multilineHeader("振分", "重量"),
    align: "right",
    sortValue: (r) => r.transferWeight,
    render: (r) => toDecimalText(r.transferWeight)
  },
  {
    key: "transferNumber",
    label: multilineHeader("振分", "本数"),
    align: "right",
    sortValue: (r) => r.transferNumber,
    render: (r) => toIntText(r.transferNumber)
  },
  {
    key: "unitPrice",
    label: "単価",
    align: "right",
    sortValue: (r) => r.unitPrice,
    render: (r) => toIntText(r.unitPrice)
  },
  {
    key: "variety",
    label: "品種",
    sortValue: (r) => r.variety,
    render: (r) => r.variety
  },
  {
    key: "teaLife",
    label: "茶期",
    sortValue: (r) => r.teaLife,
    render: (r) => r.teaLife
  },
  {
    key: "grade",
    label: "格付",
    sortValue: (r) => r.grade,
    render: (r) => r.grade
  },
  {
    key: "teaType",
    label: "茶種",
    sortValue: (r) => r.teaType,
    render: (r) => r.teaType
  },
  {
    key: "teaRank",
    label: "品柄",
    sortValue: (r) => r.teaRank,
    render: (r) => r.teaRank
  },
  {
    key: "fieldNo",
    label: "圃場",
    sortValue: (r) => r.fieldNo,
    render: (r) => r.fieldNo
  },
  {
    key: "producer",
    label: "生産者",
    sortValue: (r) => r.producer,
    render: (r) => r.producer
  },
  {
    key: "discount",
    label: multilineHeader("粉引", "(%)"),
    align: "right",
    sortValue: (r) => r.discount,
    render: (r) => toDecimalText(r.discount)
  },
  {
    key: "purchaseWeight",
    label: multilineHeader("仕入", "重量"),
    align: "right",
    sortValue: (r) => r.purchaseWeight,
    render: (r) => toDecimalText(r.purchaseWeight)
  },
  {
    key: "purchaseNumber",
    label: multilineHeader("仕入", "本数"),
    align: "right",
    sortValue: (r) => r.purchaseNumber,
    render: (r) => toIntText(r.purchaseNumber)
  },
  {
    key: "target",
    label: "用途",
    sortValue: (r) => r.target,
    render: (r) => r.target
  },
  {
    key: "targetPlan",
    label: multilineHeader("予定", "用途"),
    sortValue: (r) => r.targetPlan,
    render: (r) => r.targetPlan
  },
  {
    key: "lotNo",
    label: multilineHeader("ロット", "NO"),
    sortValue: (r) => r.lotNo,
    render: (r) => r.lotNo
  }
];

type Props = {
  rows: PurchaseResaleListRow[];
  selectedRowId: string | null;
  onRowSelect: (row: PurchaseResaleListRow) => void;
  searchExecuted?: boolean;
};

export const PurchaseResaleListMantineTable = memo(function PurchaseResaleListMantineTable({
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
      pagination={listTablePagination.purchaseResaleList}
      minTableWidth={2200}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="purchaseResaleListMantineTableRoot"
      scrollClassName="purchaseResaleListMantineScroll mantineScrollTableScroll"
      tableClassName="purchaseResaleListMantineTable mantineScrollTable"
    />
  );
});
