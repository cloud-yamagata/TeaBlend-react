/**
 * 第2工場ロット登録モーダル … 使用部品一覧（Mantine Table）
 */
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { Factory2LotEditPartRow } from "./factory2LotEditTypes";
import "./factory2LotEditPartsTable.css";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const formatUseQuantityDisplay = (value: string): string => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const num = Number(text.replace(/,/g, ""));
  return Number.isFinite(num) ? numberFormatter.format(num) : text;
};

type Props = {
  rows: Factory2LotEditPartRow[];
  canDelete: boolean;
  onDeleteRow: (id: string) => void;
};

export function Factory2LotEditPartsTable({ rows, canDelete, onDeleteRow }: Props) {
  const columns = useMemo((): MantineScrollTableColumn<Factory2LotEditPartRow>[] => {
    const base: MantineScrollTableColumn<Factory2LotEditPartRow>[] = [
      {
        key: "parentLotNo",
        label: "ロットNo",
        align: "right",
        sortable: false,
        sortValue: (r) => r.parentLotNo,
        render: (r) => r.parentLotNo
      },
      {
        key: "processName",
        label: "工程",
        align: "center",
        sortable: false,
        render: (r) => r.processName
      },
      {
        key: "partLotNo",
        label: "部品ロットNo",
        align: "right",
        sortable: false,
        sortValue: (r) => r.partLotNo,
        render: (r) => r.partLotNo
      },
      {
        key: "productNo",
        label: "製造No",
        align: "right",
        sortable: false,
        render: (r) => r.productNo
      },
      {
        key: "partName",
        label: "ロット名",
        sortable: false,
        render: (r) => r.partName
      },
      {
        key: "makeYear",
        label: "年",
        align: "center",
        sortable: false,
        render: (r) => r.makeYear
      },
      {
        key: "count",
        label: "回数",
        align: "center",
        sortable: false,
        render: (r) => r.count
      },
      {
        key: "useQuantity",
        label: "使用重量(kg)",
        align: "right",
        sortable: false,
        render: (r) => formatUseQuantityDisplay(r.useQuantity)
      },
      {
        key: "remarks",
        label: "備考",
        sortable: false,
        render: (r) => r.remarks
      }
    ];

    if (!canDelete) {
      return base;
    }

    const deleteCol: MantineScrollTableColumn<Factory2LotEditPartRow> = {
      key: "_actions",
      label: "",
      align: "center",
      sortable: false,
      render: (r) => (
        <ActionIcon
          className="f2EditPartsDeleteIcon"
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

    return [deleteCol, ...base];
  }, [canDelete, onDeleteRow]);

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.factory2LotEditParts}
      minTableWidth={1040}
      showFilter={false}
      emptyMessage="使用部品がありません"
      className="f2EditPartsMantineRoot"
      scrollClassName="f2EditPartsMantineScroll mantineScrollTableScroll"
      tableClassName="f2EditPartsMantineTable mantineScrollTable"
    />
  );
}
