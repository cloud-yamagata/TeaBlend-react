/**
 * ブレンドロット … 部品一覧（Mantine Table）
 */
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import { masterEntityCacheAtom } from "../repository/masterData";
import "../components/mantine/mantineScrollTable.css";
import {
  formatBlendLotPartItemGroupNo,
  formatBlendLotPartOrganicClass,
  toNumberText,
  type BlendLotPartItem
} from "./blendLotDisplayUtils";
import "./blendLotMantineTable.css";

export type BlendLotPartTableVariant = "detail" | "editor";

type Props = {
  rows: BlendLotPartItem[];
  /** detail=一覧の明細モーダル、editor=登録/変更モーダル */
  variant?: BlendLotPartTableVariant;
  onDeleteRow?: (rowId: string) => void;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
  hideFooter?: boolean;
};

/** モーダルフォーム幅（blendLotEditModal.css）に合わせ横スクロールなし */
const PART_TABLE_WIDTH = 780;
const PART_COL_PRODUCT_NO = 70;
const PART_COL_ITEM_NO = 70;
const PART_COL_ORGANIC = 80;
const PART_COL_ITEM_GROUP = 80;
const PART_COL_USE_QTY = 70;
const PART_COL_DELETE = 50;

const partColItemNameWidth = (withDelete: boolean): number =>
  PART_TABLE_WIDTH -
  PART_COL_PRODUCT_NO -
  PART_COL_ITEM_NO -
  PART_COL_ORGANIC -
  PART_COL_ITEM_GROUP -
  PART_COL_USE_QTY -
  (withDelete ? PART_COL_DELETE : 0);

const cellText = (value: string | number | null | undefined): string =>
  value == null || value === "" ? "" : String(value);

function buildPartColumns(
  withDelete: boolean,
  onDeleteRow: ((rowId: string) => void) | undefined,
  itemGroups: readonly { data: { item_group_no: number; item_group_name: string | null } }[]
): MantineScrollTableColumn<BlendLotPartItem>[] {
  const columns: MantineScrollTableColumn<BlendLotPartItem>[] = [
    {
      key: "productNo",
      label: "製造No",
      width: PART_COL_PRODUCT_NO,
      align: "center",
      sortable: false,
      sortValue: (r) => r.productNo,
      render: (r) => cellText(r.productNo)
    },
    {
      key: "itemNo",
      label: "仕上茶NO",
      width: PART_COL_ITEM_NO,
      align: "center",
      sortable: false,
      sortValue: (r) => r.itemNo,
      render: (r) => cellText(r.itemNo)
    },
    {
      key: "itemName",
      label: "仕上茶名",
      width: partColItemNameWidth(withDelete),
      sortable: false,
      sortValue: (r) => r.itemName ?? "",
      render: (r) => r.itemName ?? ""
    },
    {
      key: "organicClass",
      label: "有機区分",
      width: PART_COL_ORGANIC,
      align: "center",
      sortable: false,
      sortValue: (r) => r.organicClass ?? "",
      render: (r) => formatBlendLotPartOrganicClass(r.organicClass)
    },
    {
      key: "itemGroupNo",
      label: "商品分類",
      width: PART_COL_ITEM_GROUP,
      align: "center",
      sortable: false,
      sortValue: (r) => r.itemGroupNo ?? "",
      render: (r) => formatBlendLotPartItemGroupNo(r.itemGroupNo, itemGroups)
    },
    {
      key: "useQuantity",
      label: "使用数量",
      width: PART_COL_USE_QTY,
      align: "center",
      sortable: false,
      sortValue: (r) => r.useQuantity,
      render: (r) => toNumberText(r.useQuantity)
    }
  ];

  if (withDelete && onDeleteRow) {
    columns.push({
      key: "delete",
      label: "削除",
      width: PART_COL_DELETE,
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
    });
  }

  return columns;
}

export function BlendLotPartMantineTable({
  rows,
  variant = "detail",
  onDeleteRow,
  className = "blendLotPartMantineRoot",
  scrollClassName = "blendLotPartMantineScroll mantineScrollTableScroll",
  tableClassName = "blendLotPartMantineTable mantineScrollTable",
  hideFooter = true
}: Props) {
  const withDelete = variant === "editor" && onDeleteRow != null;
  const itemGroups = useAtomValue(masterEntityCacheAtom).tr_item_group;

  const columns = useMemo(
    () => buildPartColumns(withDelete, onDeleteRow, itemGroups),
    [withDelete, onDeleteRow, itemGroups]
  );

  const rootClass = [className, hideFooter ? "blendLotPartMantineRootNoFooter" : ""].filter(Boolean).join(" ");

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={listTablePagination.blendLotParts}
      minTableWidth={PART_TABLE_WIDTH}
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
