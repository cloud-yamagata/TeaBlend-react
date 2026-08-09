/**
 * 月次計画 … 使用部品一覧（Mantine Table）
 */
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import {
  toNumberText,
  toProcessTypeText,
  type MonthlyPlanPartItem
} from "./monthlyPlanDisplayUtils";
import "./monthlyPlanMantineTable.css";

export type MonthlyPlanPartTableVariant = "compact" | "full";

type Props = {
  rows: MonthlyPlanPartItem[];
  /** compact=編集（3列+削除）、full=9列（onDeleteRow あり時は削除列付き） */
  variant?: MonthlyPlanPartTableVariant;
  onDeleteRow?: (rowId: string) => void;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
  hideFooter?: boolean;
};

const cellText = (value: string | number | null | undefined): string =>
  value == null || value === "" ? "" : String(value);

function buildDeleteColumn(
  onDeleteRow: (rowId: string) => void
): MantineScrollTableColumn<MonthlyPlanPartItem> {
  return {
    key: "delete",
    label: "削除",
    align: "center",
    sortable: false,
    render: (r) => (
      <ActionIcon
        className="monthlyPlanPartDeleteIcon"
        variant="subtle"
        color="red"
        size="sm"
        onClick={() => onDeleteRow(r.id)}
        aria-label="行を削除"
        title="削除"
      >
        <IconTrash size={16} stroke={1.5} aria-hidden />
      </ActionIcon>
    )
  };
}

function buildCompactColumns(
  onDeleteRow?: (rowId: string) => void
): MantineScrollTableColumn<MonthlyPlanPartItem>[] {
  const base: MantineScrollTableColumn<MonthlyPlanPartItem>[] = [
    {
      key: "productNo",
      label: "計画/製造NO",
      align: "center",
      sortable: false,
      sortValue: (r) => r.productNo,
      render: (r) => cellText(r.productNo)
    },
    {
      key: "lotName",
      label: "ロット名",
      sortable: false,
      sortValue: (r) => r.lotName ?? "",
      render: (r) => r.lotName ?? ""
    },
    {
      key: "useUnitWeight",
      label: "使用重量(kg)",
      align: "center",
      sortable: false,
      sortValue: (r) => r.useUnitWeight,
      render: (r) => toNumberText(r.useUnitWeight)
    }
  ];

  if (!onDeleteRow) {
    return base;
  }

  return [...base, buildDeleteColumn(onDeleteRow)];
}

function buildFullColumns(
  onDeleteRow?: (rowId: string) => void
): MantineScrollTableColumn<MonthlyPlanPartItem>[] {
  const base: MantineScrollTableColumn<MonthlyPlanPartItem>[] = [
    {
      key: "lotNo",
      label: "ロットNo",
      align: "center",
      sortable: false,
      sortValue: (r) => r.lotNo,
      render: (r) => cellText(r.lotNo)
    },
    {
      key: "processType",
      label: "工程",
      align: "center",
      sortable: false,
      sortValue: (r) => r.processType ?? "",
      render: (r) => toProcessTypeText(r.processType)
    },
    {
      key: "partLotNo",
      label: "部品ロットNo",
      align: "center",
      sortable: false,
      sortValue: (r) => r.partLotNo,
      render: (r) => cellText(r.partLotNo)
    },
    {
      key: "productNo",
      label: "製造No",
      align: "center",
      sortable: false,
      sortValue: (r) => r.productNo,
      render: (r) => cellText(r.productNo)
    },
    {
      key: "lotName",
      label: "ロット名",
      sortable: false,
      sortValue: (r) => r.lotName ?? "",
      render: (r) => r.lotName ?? ""
    },
    {
      key: "makeYear",
      label: "年",
      align: "center",
      sortable: false,
      sortValue: (r) => r.makeYear,
      render: (r) => cellText(r.makeYear)
    },
    {
      key: "count",
      label: "回数",
      align: "center",
      sortable: false,
      sortValue: (r) => r.count,
      render: (r) => cellText(r.count)
    },
    {
      key: "useUnitWeight",
      label: "使用重量(kg)",
      align: "center",
      sortable: false,
      sortValue: (r) => r.useUnitWeight,
      render: (r) => toNumberText(r.useUnitWeight)
    },
    {
      key: "remarks",
      label: "備考",
      sortable: false,
      sortValue: (r) => r.remarks ?? "",
      render: (r) => r.remarks ?? ""
    }
  ];

  if (!onDeleteRow) {
    return base;
  }

  return [...base, buildDeleteColumn(onDeleteRow)];
}

export function MonthlyPlanPartMantineTable({
  rows,
  variant = "compact",
  onDeleteRow,
  className = "monthlyPlanPartMantineRoot",
  scrollClassName = "monthlyPlanPartMantineScroll mantineScrollTableScroll",
  tableClassName = "monthlyPlanPartMantineTable mantineScrollTable",
  hideFooter = true
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<MonthlyPlanPartItem>[] => {
    if (variant === "full") {
      return buildFullColumns(onDeleteRow);
    }
    return buildCompactColumns(onDeleteRow);
  }, [onDeleteRow, variant]);

  const minTableWidth = variant === "full" ? (onDeleteRow ? 1180 : 1120) : 640;
  const rootClass = [
    className,
    hideFooter ? "monthlyPlanPartMantineRootNoFooter" : "",
    variant === "full" ? "monthlyPlanPartMantineRootFull" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.monthlyPlanParts}
      minTableWidth={minTableWidth}
      showFilter={false}
      emptyMessage="使用部品がありません"
      striped={false}
      highlightOnHover
      className={rootClass}
      scrollClassName={scrollClassName}
      tableClassName={tableClassName}
    />
  );
}
