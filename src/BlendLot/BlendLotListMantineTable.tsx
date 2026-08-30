/**
 * ブレンドロット … メイン一覧（パッケージロット登録と同型）
 */
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import { toDateText, toNumberText } from "./blendLotDisplayUtils";
import type { BlendLotListRow } from "./types";
import "./blendLotMantineTable.css";

const toNumberTextFixed = (value: number | null, fractionDigits?: number): string => {
  if (value == null || !Number.isFinite(value)) return "";
  if (fractionDigits != null) return value.toFixed(fractionDigits);
  return toNumberText(value);
};

type Props = {
  rows: BlendLotListRow[];
  selectedRowId: string | null;
  onRowSelect: (row: BlendLotListRow) => void;
  loading?: boolean;
  searchExecuted?: boolean;
};

export function BlendLotListMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  loading = false,
  searchExecuted = true
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<BlendLotListRow>[] => {
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
        key: "itemName",
        label: "商品名",
        sortValue: (r) => r.itemName,
        render: (r) => r.itemName
      },
      {
        key: "unitWeight",
        label: "梱包重量",
        align: "right",
        sortValue: (r) => r.unitWeight,
        render: (r) => toNumberTextFixed(r.unitWeight, 2)
      },
      {
        key: "remarks",
        label: "摘要",
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ];
  }, []);

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.blendLot}
      minTableWidth={1200}
      showFilter={false}
      emptyMessage={emptyMessage}
      loading={loading}
      loadingMessage="読み込み中…"
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      striped={false}
      highlightOnHover
      className="blendLotListMantineRoot"
      scrollClassName="blendLotListMantineScroll mantineScrollTableScroll"
      tableClassName="blendLotListMantineTable mantineScrollTable"
    />
  );
}
