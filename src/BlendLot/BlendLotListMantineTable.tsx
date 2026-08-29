/**
 * ブレンドロット … メイン一覧（Mantine Table・複数選択・明細ボタン）
 */
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import { toDateText, toNumberText } from "./blendLotDisplayUtils";
import type { TeBlendLot } from "./types";
import "./blendLotMantineTable.css";

type Props = {
  rows: TeBlendLot[];
  getRowId: (row: TeBlendLot) => string;
  selectedRowIds: ReadonlySet<string>;
  onSelectedRowIdsChange: (ids: Set<string>) => void;
  onOpenDetail: (row: TeBlendLot) => void;
  loading?: boolean;
  searchExecuted?: boolean;
};

export function BlendLotListMantineTable({
  rows,
  getRowId,
  selectedRowIds,
  onSelectedRowIdsChange,
  onOpenDetail,
  loading = false,
  searchExecuted = true
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<TeBlendLot>[] => {
    const detailCol: MantineScrollTableColumn<TeBlendLot> = {
      key: "detail",
      label: "明細",
      align: "center",
      sortable: false,
      render: (row) => (
        <button
          className="inlineDetailButton"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetail(row);
          }}
        >
          明細
        </button>
      )
    };

    const dataCols: MantineScrollTableColumn<TeBlendLot>[] = [
      {
        key: "productNo",
        label: "製造NO",
        align: "center",
        sortValue: (r) => r.productNo,
        render: (r) => toNumberText(r.productNo)
      },
      {
        key: "workDate",
        label: "作業日",
        sortValue: (r) => r.workDate ?? "",
        render: (r) => toDateText(r.workDate)
      },
      {
        key: "itemNo",
        label: "商品NO",
        align: "center",
        sortValue: (r) => r.itemNo,
        render: (r) => toNumberText(r.itemNo)
      },
      {
        key: "itemName",
        label: "仕上品名",
        sortValue: (r) => r.itemName ?? "",
        render: (r) => r.itemName ?? ""
      },
      {
        key: "unitWeight",
        label: "梱包重量(kg)",
        align: "center",
        sortValue: (r) => r.unitWeight,
        render: (r) => toNumberText(r.unitWeight)
      },
      {
        key: "remarks",
        label: "摘要",
        sortValue: (r) => r.remarks ?? "",
        render: (r) => r.remarks ?? ""
      }
    ];

    return [detailCol, ...dataCols];
  }, [onOpenDetail]);

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={getRowId}
      columns={columns}
      pagination={listTablePagination.blendLot}
      minTableWidth={1100}
      showFilter={false}
      emptyMessage={emptyMessage}
      loading={loading}
      loadingMessage="読み込み中…"
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      striped={false}
      highlightOnHover
      className="blendLotListMantineRoot"
      scrollClassName="blendLotListMantineScroll mantineScrollTableScroll"
      tableClassName="blendLotListMantineTable mantineScrollTable"
    />
  );
}
