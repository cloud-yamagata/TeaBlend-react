/**
 * 仕入品／仕上品在庫 ZOOM … vi_factory3_stoc × item_group_no
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Group, Table, Text, TextInput, UnstyledButton } from "@mantine/core";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import "../components/factory3StocZoomModal.css";
import type { BlendLotPurchaseStocRow } from "./filterPurchaseFactory3Stoc";

const numberFormatter = new Intl.NumberFormat("ja-JP");

type SortField =
  | "itemNo"
  | "organicClass"
  | "itemGroupNo"
  | "itemName"
  | "productNo"
  | "stocQuantity";

type SortDir = "asc" | "desc";

function rowSearchText(row: BlendLotPurchaseStocRow): string {
  return [row.itemNo, row.organicClass, row.itemGroupNo, row.itemName, row.productNo, row.stocQuantity]
    .map((v) => (v == null ? "" : String(v)))
    .join("\t")
    .toLowerCase();
}

function compareRows(a: BlendLotPurchaseStocRow, b: BlendLotPurchaseStocRow, field: SortField, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  const av = a[field];
  const bv = b[field];
  if (typeof av === "number" && typeof bv === "number") {
    return mul * (av - bv);
  }
  return mul * String(av ?? "").localeCompare(String(bv ?? ""), "ja", { numeric: true });
}

function SortableTh({
  label,
  field,
  sortField,
  sortDir,
  onSort
}: {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const active = sortField === field;
  const arrow = active ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  return (
    <Table.Th className="factory3StocZoomTh">
      <UnstyledButton className="factory3StocZoomSortBtn" onClick={() => onSort(field)}>
        {label}
        {arrow}
      </UnstyledButton>
    </Table.Th>
  );
}

type Props = {
  open: boolean;
  rows: BlendLotPurchaseStocRow[];
  title: string;
  hint: string;
  onClose: () => void;
  onSelect: (row: BlendLotPurchaseStocRow) => void;
};

export function BlendLotPurchaseStocZoomModal({ open, rows, title, hint, onClose, onSelect }: Props) {
  const [filterText, setFilterText] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (open) {
      setFilterText("");
      setSortField(null);
      setSortDir("asc");
    }
  }, [open]);

  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => rowSearchText(row).includes(q));
  }, [rows, filterText]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => compareRows(a, b, sortField, sortDir));
  }, [filteredRows, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const displayCountLabel =
    sortedRows.length === rows.length
      ? `${sortedRows.length} 件`
      : `${sortedRows.length} 件（全 ${rows.length} 件中）`;

  if (!open) return null;

  return (
    <MantineZoomProvider>
      <div className="factory3StocZoomOverlay" role="presentation" onClick={onClose}>
        <section
          className="factory3StocZoomPanel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blend-lot-stoc-zoom-title"
          onClick={(e) => e.stopPropagation()}
          style={{ width: "min(980px, calc(100vw - 32px))" }}
        >
          <header className="factory3StocZoomHeader">
            <h2 id="blend-lot-stoc-zoom-title" className="factory3StocZoomTitle">
              {title}
            </h2>
            <p className="factory3StocZoomHint">{hint}</p>
          </header>

          <div className="factory3StocZoomToolbar">
            <TextInput
              className="factory3StocZoomFilterInput"
              placeholder="一覧を絞り込み（仕上茶NO・名称・製造Noなど）"
              value={filterText}
              onChange={(e) => setFilterText(e.currentTarget.value)}
              aria-label="一覧フィルタ"
            />
          </div>

          <div className="factory3StocZoomGridWrap">
            <Table.ScrollContainer minWidth={860} type="native" className="factory3StocZoomScroll">
              <Table
                striped
                highlightOnHover
                withTableBorder
                withColumnBorders
                stickyHeader
                tabularNums
                className="factory3StocZoomTable"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className="factory3StocZoomTh">選択</Table.Th>
                    <SortableTh label="仕上茶NO" field="itemNo" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="有機区分" field="organicClass" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="商品分類" field="itemGroupNo" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="仕上茶名" field="itemName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="製造No" field="productNo" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="在庫数量" field="stocQuantity" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedRows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={7} className="factory3StocZoomEmpty">
                        表示するデータがありません
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    sortedRows.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="default"
                            onClick={() => {
                              onSelect(row);
                              onClose();
                            }}
                          >
                            選択
                          </Button>
                        </Table.Td>
                        <Table.Td ta="right">{row.itemNo}</Table.Td>
                        <Table.Td ta="center">{row.organicClass}</Table.Td>
                        <Table.Td ta="center">{row.itemGroupNo}</Table.Td>
                        <Table.Td>{row.itemName}</Table.Td>
                        <Table.Td ta="right">{row.productNo}</Table.Td>
                        <Table.Td ta="right">
                          {row.stocQuantity != null && Number.isFinite(row.stocQuantity)
                            ? numberFormatter.format(row.stocQuantity)
                            : ""}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </div>

          <footer className="factory3StocZoomFooter">
            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed">
                表示: {displayCountLabel}
              </Text>
            </Group>
            <button type="button" className="factory3StocZoomCloseButton" onClick={onClose}>
              閉じる
            </button>
          </footer>
        </section>
      </div>
    </MantineZoomProvider>
  );
}
