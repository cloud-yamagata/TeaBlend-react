/**
 * 月次計画 … メイン一覧（Mantine Table・複数選択・明細ボタン）
 */
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import {
  toDateText,
  toNumberText,
  toProcessTypeText,
  toTimeText,
  type MonthlyPlanListRow
} from "./monthlyPlanDisplayUtils";
import "./monthlyPlanMantineTable.css";

const workTimeHeader = (
  <span className="mantineScrollTableHeaderMultiline">
    作業時間
    <br />
    (時:分)
  </span>
);

type Props = {
  rows: MonthlyPlanListRow[];
  getRowId: (row: MonthlyPlanListRow) => string;
  selectedRowIds: ReadonlySet<string>;
  onSelectedRowIdsChange: (ids: Set<string>) => void;
  onOpenDetail: (row: MonthlyPlanListRow) => void;
  loading?: boolean;
  searchExecuted?: boolean;
};

export function MonthlyPlanListMantineTable({
  rows,
  getRowId,
  selectedRowIds,
  onSelectedRowIdsChange,
  onOpenDetail,
  loading = false,
  searchExecuted = true
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<MonthlyPlanListRow>[] => {
    const detailCol: MantineScrollTableColumn<MonthlyPlanListRow> = {
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

    const dataCols: MantineScrollTableColumn<MonthlyPlanListRow>[] = [
      {
        key: "planNo",
        label: "計画NO",
        align: "center",
        sortValue: (r) => r.planNo,
        render: (r) => toNumberText(r.planNo)
      },
      {
        key: "year",
        label: "年",
        align: "center",
        sortValue: (r) => r.year,
        render: (r) => toNumberText(r.year)
      },
      {
        key: "month",
        label: "月",
        align: "center",
        sortValue: (r) => r.month,
        render: (r) => toNumberText(r.month)
      },
      {
        key: "processType",
        label: "工程分類",
        sortValue: (r) => r.processType ?? "",
        render: (r) => toProcessTypeText(r.processType)
      },
      {
        key: "lotName",
        label: "ロット名",
        sortValue: (r) => r.lotName ?? "",
        render: (r) => r.lotName ?? ""
      },
      {
        key: "workDate",
        label: "作業日",
        sortValue: (r) => r.workDate ?? "",
        render: (r) => toDateText(r.workDate)
      },
      {
        key: "workTime",
        label: workTimeHeader,
        sortValue: (r) => r.workTime ?? "",
        render: (r) => toTimeText(r.workTime)
      },
      {
        key: "unitWeight",
        label: "梱包重量(kg)",
        align: "center",
        sortValue: (r) => r.unitWeight,
        render: (r) => toNumberText(r.unitWeight)
      },
      {
        key: "itemNo",
        label: "商品NO",
        align: "center",
        sortValue: (r) => r.itemNo,
        render: (r) => toNumberText(r.itemNo)
      },
      {
        key: "finishedTeaName",
        label: "仕上茶名",
        sortValue: (r) => r.finishedTeaName,
        render: (r) => r.finishedTeaName
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
      pagination={listTablePagination.monthlyPlan}
      minTableWidth={1280}
      showFilter={false}
      emptyMessage={emptyMessage}
      loading={loading}
      loadingMessage="読み込み中…"
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      striped={false}
      highlightOnHover
      className="monthlyPlanListMantineRoot"
      scrollClassName="monthlyPlanListMantineScroll mantineScrollTableScroll"
      tableClassName="monthlyPlanListMantineTable mantineScrollTable"
    />
  );
}
