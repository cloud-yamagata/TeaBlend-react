/**
 * 直送先マスタ一覧 Mantine Table（ShipmentCorrect MainWindow DataGrid 列）
 */
import { memo, useMemo, type ReactNode } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../components/mantine/MantineScrollTable";
import { listTablePagination } from "../config/listTablePagination";
import "../components/mantine/mantineScrollTable.css";
import type { ShipmentCorrectRow } from "./types";
import "./shipmentCorrectTable.css";

const intFormatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

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
  rows: ShipmentCorrectRow[];
  selectedRowId: string | null;
  onRowSelect: (row: ShipmentCorrectRow) => void;
  searchExecuted?: boolean;
};

export const ShipmentCorrectMantineTable = memo(function ShipmentCorrectMantineTable({
  rows,
  selectedRowId,
  onRowSelect,
  searchExecuted = true
}: Props) {
  const columns = useMemo<MantineScrollTableColumn<ShipmentCorrectRow>[]>(
    () => [
      {
        key: "directShipmentNo",
        label: multilineHeader("直送先", "No"),
        align: "right",
        width: 50,
        sortValue: (r) => r.directShipmentNo,
        render: (r) => String(r.directShipmentNo)
      },
      {
        key: "directShipmentName",
        label: "直送先名",
        width: 300,
        sortValue: (r) => r.directShipmentName,
        render: (r) => r.directShipmentName
      },
      {
        key: "directShipmentKana",
        label: "直送先カナ",
        width: 150,
        sortValue: (r) => r.directShipmentKana,
        render: (r) => r.directShipmentKana
      },
      {
        key: "zip",
        label: multilineHeader("郵便", "番号"),
        width: 70,
        sortValue: (r) => r.zip,
        render: (r) => r.zip
      },
      {
        key: "address",
        label: "住所",
        width: 250,
        sortValue: (r) => r.address,
        render: (r) => r.address
      },
      {
        key: "phoneNo",
        label: "電話番号",
        width: 100,
        sortValue: (r) => r.phoneNo,
        render: (r) => r.phoneNo
      },
      {
        key: "faxNo",
        label: "FAX番号",
        width: 100,
        sortValue: (r) => r.faxNo,
        render: (r) => r.faxNo
      },
      {
        key: "displayOrder",
        label: multilineHeader("表示", "順"),
        align: "right",
        width: 50,
        sortValue: (r) => r.displayOrder,
        render: (r) => intFormatter.format(r.displayOrder)
      },
      {
        key: "remarks",
        label: "備考",
        width: 100,
        sortValue: (r) => r.remarks,
        render: (r) => r.remarks
      }
    ],
    []
  );

  const emptyMessage = searchExecuted
    ? "条件に一致するデータがありません"
    : "検索条件を指定して「検索」を押すと一覧を表示します";

  return (
    <MantineScrollTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      pagination={listTablePagination.shipmentCorrect}
      minTableWidth={1200}
      showFilter={false}
      emptyMessage={emptyMessage}
      selectedRowId={selectedRowId}
      onRowSelect={onRowSelect}
      className="shipmentCorrectMantineRoot"
      scrollClassName="shipmentCorrectMantineScroll mantineScrollTableScroll"
      tableClassName="shipmentCorrectMantineTable mantineScrollTable"
    />
  );
});
