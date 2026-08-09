/**
 * 第2工場入出庫実績 Mantine Table（旧 StoreTransferFa2 MainWindow.xaml DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { StoreTransferFa2Row } from "./types";
import "./storeTransferFa2Table.css";

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

type Props = {
  rows: StoreTransferFa2Row[];
  loading?: boolean;
  selectedRowId: string | null;
  onRowSelect: (row: StoreTransferFa2Row) => void;
  searchExecuted: boolean;
};

export const StoreTransferFa2MantineTable = memo(function StoreTransferFa2MantineTable({
  rows,
  loading = false,
  selectedRowId,
  onRowSelect,
  searchExecuted
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<StoreTransferFa2Row>[] => {
    return [
      {
        key: "transferNo",
        label: multilineHeader("入出庫", "No"),
        align: "right",
        sortValue: (r) => r.transferNo,
        render: (r) => (r.transferNo == null ? "" : String(r.transferNo))
      },
      {
        key: "transferDate",
        label: "移動日",
        sortValue: (r) => r.transferDate ?? "",
        render: (r) => toDateText(r.transferDate)
      },
      {
        key: "lotNo",
        label: multilineHeader("ロット", "No"),
        align: "right",
        sortValue: (r) => r.lotNo,
        render: (r) => (r.lotNo == null ? "" : String(r.lotNo))
      },
      {
        key: "lotName",
        label: "ロット名",
        sortValue: (r) => r.lotName,
        render: (r) => r.lotName
      },
      {
        key: "processTypeName",
        label: "工程種別",
        sortValue: (r) => r.processTypeName,
        render: (r) => r.processTypeName
      },
      {
        key: "productNo",
        label: multilineHeader("製造", "No"),
        align: "left",
        sortValue: (r) => r.productNo,
        render: (r) => (r.productNo == null ? "" : String(r.productNo))
      },
      {
        key: "transferTypeName",
        label: multilineHeader("移動", "種別"),
        sortValue: (r) => r.transferTypeName,
        render: (r) => r.transferTypeName
      },
      {
        key: "resultTypeName",
        label: multilineHeader("実績", "種別"),
        sortValue: (r) => r.resultTypeName,
        render: (r) => r.resultTypeName
      },
      {
        key: "lotTypeName",
        label: multilineHeader("ロット", "タイプ"),
        sortValue: (r) => r.lotTypeName,
        render: (r) => r.lotTypeName
      },
      {
        key: "reason",
        label: "事由",
        sortValue: (r) => r.reason,
        render: (r) => r.reason
      },
      {
        key: "unitWeight",
        label: multilineHeader("梱包", "重量"),
        align: "right",
        sortValue: (r) => r.unitWeight,
        render: (r) => toIntText(r.unitWeight)
      },
      {
        key: "unitNumber",
        label: multilineHeader("梱包", "本数"),
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
        label: multilineHeader("端数", "本数"),
        align: "right",
        sortValue: (r) => r.fractionNumber,
        render: (r) => toIntText(r.fractionNumber)
      },
      {
        key: "transferQuantity",
        label: multilineHeader("移動", "重量"),
        align: "right",
        sortValue: (r) => r.transferQuantity,
        render: (r) => toIntText(r.transferQuantity)
      },
      {
        key: "unitType",
        label: "単位",
        sortValue: (r) => r.unitType,
        render: (r) => r.unitType
      },
      {
        key: "remarks",
        label: "備考",
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ];
  }, []);

  return (
    <MantineScrollTable
      className="storeTransferFa2MantineRoot"
      scrollClassName="storeTransferFa2MantineScroll mantineScrollTableScroll"
      tableClassName="storeTransferFa2MantineTable mantineScrollTable"
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.storeTransferFa2}
      minTableWidth={1800}
      emptyMessage={
        searchExecuted ? "データがありません" : "検索条件を指定して「検索」を押すと一覧を表示します"
      }
      loading={loading}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      striped={false}
      highlightOnHover
    />
  );
});
