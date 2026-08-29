/**
 * ブレンドロット … 部品一覧（Mantine Table）
 */
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import { toNumberText, type BlendLotPartItem } from "./blendLotDisplayUtils";
import "./blendLotMantineTable.css";

type Props = {
  rows: BlendLotPartItem[];
  onDeleteRow?: (rowId: string) => void;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
  hideFooter?: boolean;
};

const cellText = (value: string | number | null | undefined): string =>
  value == null || value === "" ? "" : String(value);

export function BlendLotPartMantineTable({
  rows,
  onDeleteRow,
  className = "blendLotPartMantineRoot",
  scrollClassName = "blendLotPartMantineScroll mantineScrollTableScroll",
  tableClassName = "blendLotPartMantineTable mantineScrollTable",
  hideFooter = true
}: Props) {
  const columns = useMemo((): MantineScrollTableColumn<BlendLotPartItem>[] => {
    const base: MantineScrollTableColumn<BlendLotPartItem>[] = [
      {
        key: "partLotNo",
        label: "部品ロットNo",
        align: "center",
        sortable: false,
        sortValue: (r) => r.partLotNo ?? "",
        render: (r) => cellText(r.partLotNo)
      },
      {
        key: "organicClass",
        label: "有機区分",
        align: "center",
        sortable: false,
        sortValue: (r) => r.organicClass ?? "",
        render: (r) => r.organicClass ?? ""
      },
      {
        key: "itemGroupNo",
        label: "商品分類NO",
        align: "center",
        sortable: false,
        sortValue: (r) => r.itemGroupNo ?? "",
        render: (r) => cellText(r.itemGroupNo)
      },
      {
        key: "useQuantity",
        label: "使用数量",
        align: "center",
        sortable: false,
        sortValue: (r) => r.useQuantity,
        render: (r) => toNumberText(r.useQuantity)
      }
    ];

    if (!onDeleteRow) {
      return base;
    }

    return [
      ...base,
      {
        key: "delete",
        label: "削除",
        align: "center",
        sortable: false,
        render: (r) => (
          <ActionIcon
            className="blendLotPartDeleteIcon"
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
      }
    ];
  }, [onDeleteRow]);

  const minTableWidth = onDeleteRow ? 720 : 640;
  const rootClass = [className, hideFooter ? "blendLotPartMantineRootNoFooter" : ""].filter(Boolean).join(" ");

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.blendLotParts}
      minTableWidth={minTableWidth}
      showFilter={false}
      emptyMessage="部品がありません"
      striped={false}
      highlightOnHover
      className={rootClass}
      scrollClassName={scrollClassName}
      tableClassName={tableClassName}
    />
  );
}
