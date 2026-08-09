/**
 * 第2工場ロット在庫一覧 ZOOM（vi_factory2_stock）
 *
 * 検証用: @mantine/core Table（ページングなし・ヘッダー固定・一覧スクロール）。
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Group, Table, Text, TextInput, UnstyledButton } from "@mantine/core";
import {
  formatFactory2ProcessType,
  processTypeShortName
} from "../Factory2LotManufacture/factory2LotDisplay";
import type { ViFactory2Stock, ViFactory2StockData } from "../domain/masterTableEntityModels";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import "./factory2StockZoomModal.css";

const numberFormatter = new Intl.NumberFormat("ja-JP");

export type Factory2StockZoomRow = ViFactory2StockData & {
  id: string;
};

type SortField =
  | "lot_no"
  | "process_type"
  | "process_type_name"
  | "product_no"
  | "product_date"
  | "item_name"
  | "lot_name"
  | "organic_class"
  | "make_year"
  | "count"
  | "product_quantity"
  | "factory2_stock";

type SortDir = "asc" | "desc";

const formatDate = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return value;
  return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
};

const formatIdNumber = (value: unknown): string => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? String(n) : "";
};

function stockRowId(stock: ViFactory2Stock): string {
  const d = stock.data;
  return `${d.lot_no}-${d.process_type}-${d.product_no}`;
}

function toGridRow(stock: ViFactory2Stock): Factory2StockZoomRow {
  const d = stock.data;
  return {
    id: stockRowId(stock),
    lot_no: d.lot_no,
    process_type: d.process_type,
    process_type_name: d.process_type_name,
    product_no: d.product_no,
    product_date: d.product_date,
    item_name: d.item_name,
    lot_name: d.lot_name,
    organic_class: d.organic_class,
    make_year: d.make_year,
    count: d.count,
    product_quantity: d.product_quantity,
    factory2_stock: d.factory2_stock
  };
}

function processTypeLabel(row: Factory2StockZoomRow): string {
  return formatFactory2ProcessType(String(row.process_type ?? ""));
}

function processTypeNameLabel(row: Factory2StockZoomRow): string {
  const name = row.process_type_name?.trim() ?? "";
  if (name) return name;
  return processTypeShortName(String(row.process_type ?? ""));
}

function rowSearchText(row: Factory2StockZoomRow): string {
  return [
    row.lot_no,
    processTypeLabel(row),
    processTypeNameLabel(row),
    row.product_no,
    formatDate(row.product_date),
    row.item_name,
    row.lot_name,
    row.organic_class,
    row.make_year,
    row.count,
    row.product_quantity,
    row.factory2_stock
  ]
    .map((v) => (v == null ? "" : String(v)))
    .join("\t")
    .toLowerCase();
}

function compareRows(a: Factory2StockZoomRow, b: Factory2StockZoomRow, field: SortField, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  const av = a[field];
  const bv = b[field];

  if (field === "process_type") {
    return mul * processTypeLabel(a).localeCompare(processTypeLabel(b), "ja");
  }
  if (field === "process_type_name") {
    return mul * processTypeNameLabel(a).localeCompare(processTypeNameLabel(b), "ja");
  }
  if (typeof av === "number" && typeof bv === "number") {
    return mul * (av - bv);
  }
  return mul * String(av ?? "").localeCompare(String(bv ?? ""), "ja", { numeric: true });
}

export type Factory2StockZoomModalProps = {
  open: boolean;
  stocks: ViFactory2Stock[];
  onClose: () => void;
  onSelect: (stock: ViFactory2Stock) => void;
  title?: string;
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
    <Table.Th className="factory2StockZoomTh">
      <UnstyledButton className="factory2StockZoomSortBtn" onClick={() => onSort(field)}>
        {label}
        {arrow}
      </UnstyledButton>
    </Table.Th>
  );
}

export function Factory2StockZoomModal({
  open,
  stocks,
  onClose,
  onSelect,
  title = "第2工場ロット在庫一覧"
}: Factory2StockZoomModalProps) {
  const [filterText, setFilterText] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { rows, stockById } = useMemo(() => {
    const map = new Map<string, ViFactory2Stock>();
    const list = stocks.map((s) => {
      map.set(stockRowId(s), s);
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

  const handleSelectClick = (row: Factory2StockZoomRow) => {
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
      <div className="factory2StockZoomOverlay" role="presentation" onClick={onClose}>
        <section
          className="factory2StockZoomPanel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="factory2-stock-zoom-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="factory2StockZoomHeader">
            <h2 id="factory2-stock-zoom-title" className="factory2StockZoomTitle">
              {title}
            </h2>
            <p className="factory2StockZoomHint">
              {rows.length} 件（在庫重量 &gt; 0）・Mantine Table 検証版・ページングなし・一覧をスクロールして全件表示・列ヘッダーでソート
            </p>
          </header>

          <div className="factory2StockZoomToolbar">
            <TextInput
              className="factory2StockZoomFilterInput"
              placeholder="一覧を絞り込み（ロットNo・通称名・工程など）"
              value={filterText}
              onChange={(e) => setFilterText(e.currentTarget.value)}
              aria-label="一覧フィルタ"
            />
          </div>

          <div className="factory2StockZoomGridWrap">
            <Table.ScrollContainer minWidth={1200} type="native" className="factory2StockZoomScroll">
              <Table
                striped
                highlightOnHover
                withTableBorder
                withColumnBorders
                stickyHeader
                tabularNums
                className="factory2StockZoomTable"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className="factory2StockZoomTh">選択</Table.Th>
                    <SortableTh
                      label="ロットNo"
                      field="lot_no"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="工程区分"
                      field="process_type"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="工程区分名"
                      field="process_type_name"
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
                      label="製造日"
                      field="product_date"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="通称名"
                      field="item_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="ロット名"
                      field="lot_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="有機区分"
                      field="organic_class"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="年度"
                      field="make_year"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="回数"
                      field="count"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="製造重量"
                      field="product_quantity"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="在庫重量"
                      field="factory2_stock"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedRows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={13} className="factory2StockZoomEmpty">
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
                        <Table.Td ta="right">{formatIdNumber(row.lot_no)}</Table.Td>
                        <Table.Td>{processTypeLabel(row)}</Table.Td>
                        <Table.Td>{processTypeNameLabel(row)}</Table.Td>
                        <Table.Td ta="right">{formatIdNumber(row.product_no)}</Table.Td>
                        <Table.Td>{formatDate(row.product_date)}</Table.Td>
                        <Table.Td>{row.item_name ?? ""}</Table.Td>
                        <Table.Td>{row.lot_name ?? ""}</Table.Td>
                        <Table.Td ta="center">{row.organic_class ?? ""}</Table.Td>
                        <Table.Td ta="center">{row.make_year ?? ""}</Table.Td>
                        <Table.Td ta="center">{row.count ?? ""}</Table.Td>
                        <Table.Td ta="right">
                          {row.product_quantity != null && Number.isFinite(row.product_quantity)
                            ? numberFormatter.format(row.product_quantity)
                            : ""}
                        </Table.Td>
                        <Table.Td ta="right">
                          {row.factory2_stock != null && Number.isFinite(row.factory2_stock)
                            ? numberFormatter.format(row.factory2_stock)
                            : ""}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </div>

          <footer className="factory2StockZoomFooter">
            <Group justify="space-between" align="center" wrap="wrap" className="factory2StockZoomFooterInner">
              <Text size="sm" c="dimmed">
                表示: {displayCountLabel}
              </Text>
            </Group>
            <button type="button" className="factory2StockZoomCloseButton" onClick={onClose}>
              閉じる
            </button>
          </footer>
        </section>
      </div>
    </MantineZoomProvider>
  );
}
