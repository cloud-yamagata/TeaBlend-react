/**
 * 仕入実績情報一覧 Mantine Table（旧 MainWindow.xaml DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { PurchaseTtransferRow } from "./types";
import "./purchaseTtransferTable.css";

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

/** Mantine Checkbox より軽量（原料列など表示専用） */
const ReadOnlyCheckbox = ({
  checked,
  disabled,
  ariaLabel
}: {
  checked: boolean;
  disabled?: boolean;
  ariaLabel: string;
}) => (
  <input
    type="checkbox"
    className="purchaseTtransferReadOnlyCheckbox"
    checked={checked}
    disabled={disabled}
    readOnly
    aria-label={ariaLabel}
    tabIndex={-1}
  />
);

/** 一括変更（選）チェック … 残量状況=未 の行のみ操作可 */
const BulkUpdateCheckbox = ({
  row,
  checked,
  onToggle
}: {
  row: PurchaseTtransferRow;
  checked: boolean;
  onToggle: (row: PurchaseTtransferRow) => void;
}) => (
  <input
    type="checkbox"
    className="purchaseTtransferBulkUpdateCheckbox"
    checked={checked}
    disabled={!row.isBulkUpdateSelectable}
    aria-label="一括変更対象"
    onClick={(e) => e.stopPropagation()}
    onChange={() => {
      if (row.isBulkUpdateSelectable) onToggle(row);
    }}
  />
);

const buildColumns = (
  bulkUpdateSelectedIds: ReadonlySet<string>,
  onBulkUpdateToggle: (row: PurchaseTtransferRow) => void
): MantineScrollTableColumn<PurchaseTtransferRow>[] => [
  {
    key: "bulkUpdateSel",
    label: multilineHeader("選", "択"),
    align: "center",
    width: 30,
    sortable: false,
    render: (r) => (
      <BulkUpdateCheckbox
        row={r}
        checked={bulkUpdateSelectedIds.has(r.id)}
        onToggle={onBulkUpdateToggle}
      />
    )
  },
  {
    key: "isSelected",
    label: multilineHeader("原", "料"),
    align: "center",
    width: 30,
    sortable: false,
    render: (r) => (
      <ReadOnlyCheckbox
        checked={r.isSelected}
        disabled={!r.isMaterialSelectable}
        ariaLabel="原料登録対象"
      />
    )
  },
  {
    key: "year",
    label: multilineHeader("年", "度"),
    align: "right",
    width: 30,
    sortValue: (r) => r.year,
    render: (r) => toIntText(r.year)
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
    width: 80,
    sortValue: (r) => r.purchaseDate ?? "",
    render: (r) => toDateText(r.purchaseDate)
  },
  {
    key: "purchase",
    label: "仕入先",
    width: 100,
    sortValue: (r) => r.purchase,
    render: (r) => r.purchase
  },
  {
    key: "variety",
    label: "品種",
    width: 60,
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
    label: multilineHeader("圃", "場"),
    width: 30,
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
    key: "purchaseWeight",
    label: multilineHeader("仕入", "重量"),
    align: "right",
    width: 60,
    sortValue: (r) => r.purchaseWeight,
    render: (r) => toDecimalText(r.purchaseWeight)
  },
  {
    key: "cost",
    label: "単価",
    align: "right",
    width: 40,
    sortValue: (r) => r.cost,
    render: (r) => toIntText(r.cost)
  },
  {
    key: "discount",
    label: multilineHeader("粉", "引"),
    align: "right",
    width: 40,
    sortValue: (r) => r.discount,
    render: (r) => toDecimalText(r.discount)
  },
  {
    key: "status",
    label: multilineHeader("残量", "状況"),
    align: "center",
    width: 40,
    sortValue: (r) => r.status,
    render: (r) => r.status
  },
  {
    key: "transferQuantity",
    label: multilineHeader("振分", "重量"),
    align: "right",
    width: 60,
    sortValue: (r) => r.transferQuantity,
    render: (r) => toDecimalText(r.transferQuantity)
  },
  {
    key: "target",
    label: "用途",
    width: 120,
    sortValue: (r) => r.target,
    render: (r) => r.target
  },
  {
    key: "targetPlan",
    label: multilineHeader("予定", "用途"),
    width: 100,
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
  rows: PurchaseTtransferRow[];
  loading?: boolean;
  selectedRowId: string | null;
  onRowSelect: (row: PurchaseTtransferRow) => void;
  bulkUpdateSelectedIds?: ReadonlySet<string>;
  onBulkUpdateToggle?: (row: PurchaseTtransferRow) => void;
  searchExecuted?: boolean;
};

export const PurchaseTtransferMantineTable = memo(function PurchaseTtransferMantineTable({
  rows,
  loading = false,
  selectedRowId,
  onRowSelect,
  bulkUpdateSelectedIds = new Set(),
  onBulkUpdateToggle = () => {},
  searchExecuted = true
}: Props) {
  const columns = useMemo(
    () => buildColumns(bulkUpdateSelectedIds, onBulkUpdateToggle),
    [bulkUpdateSelectedIds, onBulkUpdateToggle]
  );

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.purchaseTtransfer}
      showFilter={false}
      loading={loading}
      loadingMessage="マスタ読込中…"
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      striped={false}
      highlightOnHover
      className="purchaseTtransferMantineRoot"
      scrollClassName="purchaseTtransferMantineScroll mantineScrollTableScroll"
      tableClassName="purchaseTtransferMantineTable mantineScrollTable"
    />
  );
});
