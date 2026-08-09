/**
 * 原料実績情報一覧 Mantine Table（旧 MainWindow.xaml DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { MaterialRresultRow } from "./types";
import "./materialRresultTable.css";

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

const MaterialCheckbox = ({
  row,
  checked,
  onToggle
}: {
  row: MaterialRresultRow;
  checked: boolean;
  onToggle: (row: MaterialRresultRow) => void;
}) => (
  <input
    type="checkbox"
    className="materialRresultMaterialCheckbox"
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
  rows: MaterialRresultRow[];
  selectedRowId: string | null;
  onRowSelect: (row: MaterialRresultRow) => void;
  materialSelectedIds: ReadonlySet<string>;
  onMaterialToggle: (row: MaterialRresultRow) => void;
  searchExecuted?: boolean;
};

function MaterialRresultMantineTableInner({
  rows,
  selectedRowId,
  onRowSelect,
  materialSelectedIds,
  onMaterialToggle,
  searchExecuted = true
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<MaterialRresultRow>[]>(
    () => [
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
        key: "year",
        label: multilineHeader("年", "度"),
        align: "right",
        width: 30,
        sortValue: (r) => r.year,
        render: (r) =>
          r.year == null ? "" : String(r.year >= 100 ? r.year % 100 : r.year)
      },
      {
        key: "purchase",
        label: "仕入先",
        width: 80,
        sortValue: (r) => r.purchase,
        render: (r) => r.purchase
      },
      {
        key: "purchaseDate",
        label: "仕入日",
        width: 90,
        sortValue: (r) => r.purchaseDate ?? "",
        render: (r) => toDateText(r.purchaseDate)
      },
      {
        key: "productNo",
        label: "製造No",
        width: 70,
        sortValue: (r) => r.productNo,
        render: (r) => r.productNo
      },
      {
        key: "teaRank",
        label: "品柄",
        width: 50,
        sortValue: (r) => r.teaRank,
        render: (r) => r.teaRank
      },
      {
        key: "rank",
        label: multilineHeader("等", "級"),
        width: 30,
        sortValue: (r) => r.rank,
        render: (r) => r.rank
      },
      {
        key: "teaType",
        label: "茶種",
        width: 50,
        sortValue: (r) => r.teaType,
        render: (r) => r.teaType
      },
      {
        key: "teaLife",
        label: "茶期",
        width: 50,
        sortValue: (r) => r.teaLife,
        render: (r) => r.teaLife
      },
      {
        key: "organicClass",
        label: multilineHeader("格", "付"),
        width: 30,
        sortValue: (r) => r.organicClass,
        render: (r) => r.organicClass
      },
      {
        key: "producer",
        label: "生産者",
        width: 80,
        sortValue: (r) => r.producer,
        render: (r) => r.producer
      },
      {
        key: "materialName",
        label: "原料名",
        width: 220,
        sortValue: (r) => r.materialName,
        render: (r) => r.materialName
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
        width: 70,
        sortValue: (r) => r.purchaseWeight,
        render: (r) => toDecimalText(r.purchaseWeight)
      },
      {
        key: "status",
        label: multilineHeader("確", "定"),
        width: 30,
        sortValue: (r) => r.status,
        render: (r) => r.status
      },
      {
        key: "remarks",
        label: "備考",
        width: 150,
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ],
    [materialSelectedIds, onMaterialToggle]
  );

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.materialRresult}
      minTableWidth={1280}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      striped={false}
      highlightOnHover
      className="materialRresultMantineRoot"
      scrollClassName="materialRresultMantineScroll mantineScrollTableScroll"
      tableClassName="materialRresultMantineTable mantineScrollTable"
    />
  );
}

export const MaterialRresultMantineTable = memo(MaterialRresultMantineTableInner);
