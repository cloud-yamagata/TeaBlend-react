/**
 * 第1工場生産実績情報一覧 Mantine Table（旧 MainWindow.xaml DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { Factory1RresultRow } from "./types";
import "./factory1RresultTable.css";

const intFormatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 2,
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

const toIntText = (value: number | null): string => (value == null ? "" : intFormatter.format(value));
const toDecimalText = (value: number | null): string =>
  value == null ? "" : decimalFormatter.format(value);

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

const BulkTransferCheckbox = ({
  row,
  checked,
  onToggle
}: {
  row: Factory1RresultRow;
  checked: boolean;
  onToggle: (row: Factory1RresultRow) => void;
}) => (
  <input
    type="checkbox"
    className="factory1RresultBulkCheckbox"
    checked={checked}
    disabled={!row.isBulkTransferSelectable}
    aria-label="一括受入対象"
    onClick={(e) => e.stopPropagation()}
    onChange={() => {
      if (row.isBulkTransferSelectable) onToggle(row);
    }}
  />
);

const MaterialCheckbox = ({
  row,
  checked,
  onToggle
}: {
  row: Factory1RresultRow;
  checked: boolean;
  onToggle: (row: Factory1RresultRow) => void;
}) => (
  <input
    type="checkbox"
    className="factory1RresultMaterialCheckbox"
    checked={checked}
    disabled={!row.isMaterialSelectable}
    aria-label="原料登録対象"
    onClick={(e) => e.stopPropagation()}
    onChange={() => {
      if (row.isMaterialSelectable) onToggle(row);
    }}
  />
);

type Props = {
  rows: Factory1RresultRow[];
  selectedRowId: string | null;
  onRowSelect: (row: Factory1RresultRow) => void;
  bulkTransferSelectedIds: ReadonlySet<string>;
  onBulkTransferToggle: (row: Factory1RresultRow) => void;
  materialSelectedIds: ReadonlySet<string>;
  onMaterialToggle: (row: Factory1RresultRow) => void;
  searchExecuted?: boolean;
};

function Factory1RresultMantineTableInner({
  rows,
  selectedRowId,
  onRowSelect,
  bulkTransferSelectedIds,
  onBulkTransferToggle,
  materialSelectedIds,
  onMaterialToggle,
  searchExecuted = true
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<Factory1RresultRow>[]>(
    () => [
      {
        key: "bulkTransferSel",
        label: multilineHeader("選", "択"),
        align: "center",
        width: 30,
        sortable: false,
        render: (r) => (
          <BulkTransferCheckbox
            row={r}
            checked={bulkTransferSelectedIds.has(r.id)}
            onToggle={onBulkTransferToggle}
          />
        )
      },
      {
        key: "materialSel",
        label: multilineHeader("原", "料"),
        align: "center",
        width: 30,
        sortable: false,
        render: (r) => (
          <MaterialCheckbox
            row={r}
            checked={materialSelectedIds.has(r.id)}
            onToggle={onMaterialToggle}
          />
        )
      },
      {
        key: "lotNo",
        label: "ロットNO",
        width: 120,
        sortValue: (r) => r.lotNo,
        render: (r) => r.lotNo
      },
      {
        key: "year",
        label: multilineHeader("年", "度"),
        align: "right",
        width: 30,
        sortValue: (r) => r.year,
        render: (r) =>
          r.year == null ? "" : String(r.year >= 100 ? r.year % 100 : r.year)
      },
      {
        key: "workDate",
        label: "生産日",
        width: 90,
        sortValue: (r) => r.workDate ?? "",
        render: (r) => toDateText(r.workDate)
      },
      {
        key: "variety",
        label: "品種",
        width: 70,
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
        label: multilineHeader("生産", "重量"),
        align: "right",
        width: 60,
        sortValue: (r) => r.purchaseWeight,
        render: (r) => toDecimalText(r.purchaseWeight)
      },
      {
        key: "status",
        label: multilineHeader("残量", "状況"),
        align: "center",
        width: 50,
        sortValue: (r) => r.status,
        render: (r) => r.status
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
        key: "transferDate",
        label: "最新移動日",
        width: 90,
        sortValue: (r) => r.transferDate ?? "",
        render: (r) => toDateText(r.transferDate)
      },
      {
        key: "transferUnitNumber",
        label: multilineHeader("移動", "梱包"),
        align: "right",
        width: 40,
        sortValue: (r) => r.transferUnitNumber,
        render: (r) => toIntText(r.transferUnitNumber)
      },
      {
        key: "transferFractionNumber",
        label: multilineHeader("移動", "端数"),
        align: "right",
        width: 40,
        sortValue: (r) => r.transferFractionNumber,
        render: (r) => toIntText(r.transferFractionNumber)
      },
      {
        key: "target",
        label: "用途",
        width: 60,
        sortValue: (r) => r.target,
        render: (r) => r.target
      },
      {
        key: "remarks",
        label: "備考",
        width: 100,
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ],
    [bulkTransferSelectedIds, onBulkTransferToggle, materialSelectedIds, onMaterialToggle]
  );

  return (
    <MantineScrollTable
      className="factory1RresultMantineRoot"
      scrollClassName="factory1RresultMantineScroll mantineScrollTableScroll"
      tableClassName="factory1RresultMantineTable mantineScrollTable"
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      emptyMessage={
        searchExecuted
          ? "条件に一致するデータがありません"
          : "検索条件を指定して「検索」を押すと一覧を表示します"
      }
      pagination={listTablePagination.factory1Rresult}
    />
  );
}

export const Factory1RresultMantineTable = memo(Factory1RresultMantineTableInner);
