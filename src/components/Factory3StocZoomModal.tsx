/**
 * 第3工場仕上茶在庫一覧 ZOOM（vi_factory3_stoc）
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Group, Table, Text, TextInput, UnstyledButton } from "@mantine/core";
import type { ViFactory3Stoc, ViFactory3StocData } from "../domain/masterTableEntityModels";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import "./factory3StocZoomModal.css";

const numberFormatter = new Intl.NumberFormat("ja-JP");

export type Factory3StocZoomRow = ViFactory3StocData & {
  id: string;
};

type SortField = "item_no" | "item_name" | "product_no" | "stoc_quantity";

type SortDir = "asc" | "desc";

function stocRowId(stoc: ViFactory3Stoc): string {
  const d = stoc.data;
  return `${d.item_no}-${d.product_no}`;
}

function toGridRow(stoc: ViFactory3Stoc): Factory3StocZoomRow {
  const d = stoc.data;
  return {
    id: stocRowId(stoc),
    item_no: d.item_no,
    item_name: d.item_name,
    product_no: d.product_no,
    stoc_quantity: d.stoc_quantity
  };
}

function rowSearchText(row: Factory3StocZoomRow): string {
  return [row.item_no, row.item_name, row.product_no, row.stoc_quantity]
    .map((v) => (v == null ? "" : String(v)))
    .join("\t")
    .toLowerCase();
}

function compareRows(a: Factory3StocZoomRow, b: Factory3StocZoomRow, field: SortField, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  const av = a[field];
  const bv = b[field];
  if (typeof av === "number" && typeof bv === "number") {
    return mul * (av - bv);
  }
  return mul * String(av ?? "").localeCompare(String(bv ?? ""), "ja", { numeric: true });
}

export type Factory3StocZoomModalProps = {
  open: boolean;
  stocks: ViFactory3Stoc[];
  onClose: () => void;
  onSelect: (stock: ViFactory3Stoc) => void;
  title?: string;
  targetRowLabel?: string;
};

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

export function Factory3StocZoomModal({
  open,
  stocks,
  onClose,
  onSelect,
  title = "第3工場仕上茶在庫一覧",
  targetRowLabel
}: Factory3StocZoomModalProps) {
  const [filterText, setFilterText] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { rows, stockById } = useMemo(() => {
    const map = new Map<string, ViFactory3Stoc>();
    const list = stocks.map((s) => {
      map.set(stocRowId(s), s);
      return toGridRow(s);
    });
    return { rows: list, stockById: map };
  }, [stocks]);

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

  const handleSelectClick = (row: Factory3StocZoomRow) => {
    const stock = stockById.get(row.id);
    if (!stock) return;
    onSelect(stock);
    onClose();
  };

  const displayCountLabel =
    sortedRows.length === rows.length
      ? `${sortedRows.length} 件`
      : `${sortedRows.length} 件（全 ${rows.length} 件中）`;

  if (!open) {
    return null;
  }

  return (
    <MantineZoomProvider>
      <div className="factory3StocZoomOverlay" role="presentation" onClick={onClose}>
        <section
          className="factory3StocZoomPanel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="factory3-stoc-zoom-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="factory3StocZoomHeader">
            <h2 id="factory3-stoc-zoom-title" className="factory3StocZoomTitle">
              {title}
            </h2>
            <p className="factory3StocZoomHint">
              {targetRowLabel ? `${targetRowLabel} へセット · ` : ""}
              在庫数量 &gt; 0 · 列ヘッダーでソート
            </p>
          </header>

          <div className="factory3StocZoomToolbar">
            <TextInput
              className="factory3StocZoomFilterInput"
              placeholder="一覧を絞り込み（商品No・商品名・製造Noなど）"
              value={filterText}
              onChange={(e) => setFilterText(e.currentTarget.value)}
              aria-label="一覧フィルタ"
            />
          </div>

          <div className="factory3StocZoomGridWrap">
            <Table.ScrollContainer minWidth={640} type="native" className="factory3StocZoomScroll">
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
                    <SortableTh
                      label="商品No"
                      field="item_no"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="商品名"
                      field="item_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="製造No"
                      field="product_no"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="在庫数量"
                      field="stoc_quantity"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedRows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="factory3StocZoomEmpty">
                        表示するデータがありません
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    sortedRows.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>
                          <Button size="xs" variant="default" onClick={() => handleSelectClick(row)}>
                            選択
                          </Button>
                        </Table.Td>
                        <Table.Td ta="right">{row.item_no}</Table.Td>
                        <Table.Td>{row.item_name ?? ""}</Table.Td>
                        <Table.Td ta="right">{row.product_no}</Table.Td>
                        <Table.Td ta="right">
                          {row.stoc_quantity != null && Number.isFinite(row.stoc_quantity)
                            ? numberFormatter.format(row.stoc_quantity)
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
