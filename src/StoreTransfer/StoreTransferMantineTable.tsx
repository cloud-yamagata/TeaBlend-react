/**
 * 第3工場入出庫実績 Mantine Table（te_store_transfer）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { StoreTransferRow } from "./types";
import "./storeTransferTable.css";

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
  rows: StoreTransferRow[];
  loading?: boolean;
  selectedRowId: string | null;
  onRowSelect: (row: StoreTransferRow) => void;
  searchExecuted: boolean;
};

export const StoreTransferMantineTable = memo(function StoreTransferMantineTable({
  rows,
  loading = false,
  selectedRowId,
  onRowSelect,
  searchExecuted
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<StoreTransferRow>[] => {
    return [
      {
        key: "transferNo",
        label: multilineHeader("入出庫", "No"),
        align: "right",
        sortValue: (r) => r.transferNo,
        render: (r) => String(r.transferNo)
      },
      {
        key: "transferDate",
        label: "移動日",
        sortValue: (r) => r.transferDate ?? "",
        render: (r) => toDateText(r.transferDate)
      },
      {
        key: "itemNo",
        label: multilineHeader("商品", "No"),
        align: "right",
        sortValue: (r) => r.itemNo,
        render: (r) => String(r.itemNo)
      },
      {
        key: "productNo",
        label: multilineHeader("製造", "No"),
        align: "right",
        sortValue: (r) => r.productNo,
        render: (r) => String(r.productNo)
      },
      {
        key: "lotNo",
        label: multilineHeader("ロット", "No"),
        sortValue: (r) => r.lotNo,
        render: (r) => r.lotNo
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
        key: "storePartyName",
        label: "相手先名",
        sortValue: (r) => r.storePartyName,
        render: (r) => r.storePartyName
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
        render: (r) => toDecimalText(r.unitWeight)
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
        label: multilineHeader("移動", "量"),
        align: "right",
        sortValue: (r) => r.transferQuantity,
        render: (r) => toDecimalText(r.transferQuantity)
      },
      {
        key: "unitType",
        label: "単位",
        sortValue: (r) => r.unitType,
        render: (r) => r.unitType
      },
      {
        key: "remarks",
        label: "摘要",
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ];
  }, []);

  return (
    <MantineScrollTable
      className="storeTransferMantineRoot"
      scrollClassName="storeTransferMantineScroll mantineScrollTableScroll"
      tableClassName="storeTransferMantineTable mantineScrollTable"
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.storeTransfer}
      minTableWidth={1700}
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
