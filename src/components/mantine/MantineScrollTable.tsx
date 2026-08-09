/**
 * Mantine Table 共通（ヘッダー固定・ソート・任意のクライアント絞り込み）。
 * 一覧の条件検索は各画面の検索パネルで行い、表上の絞り込みは既定オフ。
 * データ部背景は honeydew（`mantineScrollTable.css` の CSS 変数）。
 * ページングは画面別設定（listTablePagination）のみ。有のとき 100 件/ページ固定。
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Checkbox, Group, Pagination, Table, Text, TextInput, UnstyledButton } from "@mantine/core";
import { usePagination } from "@mantine/hooks";
import {
  LIST_TABLE_PAGE_SIZE,
  type ListTablePaginationMode,
  isListTablePaged
} from "../../config/listTablePagination";

export type SortDir = "asc" | "desc";

export type MantineScrollTableColumn<T> = {
  key: string;
  label: ReactNode;
  align?: "left" | "right" | "center";
  /** px。指定時は colgroup で列幅を固定 */
  width?: number;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null;
  render: (row: T) => ReactNode;
};

export type MantineScrollTableProps<T> = {
  rows: T[];
  getRowId: (row: T) => string;
  columns: MantineScrollTableColumn<T>[];
  /** 画面別設定。省略時はページングなし */
  pagination?: ListTablePaginationMode;
  minTableWidth?: number;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  showFilter?: boolean;
  filterPlaceholder?: string;
  /** 単一行選択（行クリック） */
  selectedRowId?: string | null;
  onRowSelect?: (row: T) => void;
  /** 複数行選択（チェックボックス） */
  selectedRowIds?: ReadonlySet<string>;
  onSelectedRowIdsChange?: (ids: Set<string>) => void;
  striped?: boolean;
  highlightOnHover?: boolean;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
};

function compareSortValues(a: string | number | null, b: string | number | null, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") {
    return mul * (a - b);
  }
  return mul * String(a ?? "").localeCompare(String(b ?? ""), "ja", { numeric: true });
}

function columnWidthStyle(width: number | undefined): React.CSSProperties | undefined {
  if (width == null) return undefined;
  return { width, minWidth: width, maxWidth: width };
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  width
}: {
  label: ReactNode;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  width?: number;
}) {
  const arrow = active ? (dir === "asc" ? " ▲" : " ▼") : "";
  return (
    <Table.Th className="mantineScrollTableTh" style={columnWidthStyle(width)}>
      <UnstyledButton className="mantineScrollTableSortBtn" onClick={onClick}>
        {label}
        {arrow}
      </UnstyledButton>
    </Table.Th>
  );
}

export function MantineScrollTable<T>({
  rows,
  getRowId,
  columns,
  pagination = false,
  minTableWidth = 1100,
  emptyMessage = "表示するデータがありません",
  loading = false,
  loadingMessage = "読み込み中…",
  showFilter = false,
  filterPlaceholder = "一覧を絞り込み",
  selectedRowId = null,
  onRowSelect,
  selectedRowIds,
  onSelectedRowIdsChange,
  striped = false,
  highlightOnHover = true,
  className,
  scrollClassName,
  tableClassName
}: MantineScrollTableProps<T>) {
  const paged = isListTablePaged(pagination);
  const pageSize = paged ? LIST_TABLE_PAGE_SIZE : 0;

  const [filterText, setFilterText] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const line = columns
        .map((col) => {
          const v = col.sortValue?.(row);
          if (v != null) return String(v);
          return "";
        })
        .join("\t")
        .toLowerCase();
      return line.includes(q);
    });
  }, [rows, filterText, columns]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredRows;
    const getVal = (row: T) => col.sortValue?.(row) ?? "";
    return [...filteredRows].sort((a, b) => compareSortValues(getVal(a), getVal(b), sortDir));
  }, [filteredRows, sortKey, sortDir, columns]);

  const totalPages = paged ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;

  useEffect(() => {
    setPage(1);
  }, [rows, filterText, sortKey, sortDir, paged]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginationCtl = usePagination({
    total: totalPages,
    page,
    onChange: setPage
  });

  const displayRows = useMemo(() => {
    if (!paged) return sortedRows;
    const start = (paginationCtl.active - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, paged, paginationCtl.active, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const multiSelect = onSelectedRowIdsChange != null;
  const colSpan = columns.length + (multiSelect ? 1 : 0);

  const displayRowIds = useMemo(
    () => displayRows.map((row) => getRowId(row)),
    [displayRows, getRowId]
  );

  const allPageSelected =
    multiSelect &&
    displayRowIds.length > 0 &&
    displayRowIds.every((id) => selectedRowIds?.has(id) ?? false);
  const somePageSelected =
    multiSelect && displayRowIds.some((id) => selectedRowIds?.has(id) ?? false);

  const togglePageSelection = () => {
    if (!onSelectedRowIdsChange) return;
    const next = new Set(selectedRowIds ?? []);
    if (allPageSelected) {
      for (const id of displayRowIds) {
        next.delete(id);
      }
    } else {
      for (const id of displayRowIds) {
        next.add(id);
      }
    }
    onSelectedRowIdsChange(next);
  };

  const toggleRowSelection = (rowId: string) => {
    if (!onSelectedRowIdsChange) return;
    const next = new Set(selectedRowIds ?? []);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectedRowIdsChange(next);
  };

  const countLabel = useMemo(() => {
    const filteredNote = sortedRows.length !== rows.length ? `（抽出前 ${rows.length} 件）` : "";
    if (!paged) {
      return `表示: ${sortedRows.length} 件${filteredNote}`;
    }
    if (sortedRows.length === 0) {
      return `0 件${filteredNote}`;
    }
    const start = (paginationCtl.active - 1) * pageSize + 1;
    const end = Math.min(paginationCtl.active * pageSize, sortedRows.length);
    return `${start}–${end} / ${sortedRows.length} 件${filteredNote}（${pageSize} 件/ページ）`;
  }, [sortedRows.length, rows.length, paged, paginationCtl.active, pageSize]);

  const hasFixedColumnWidths = columns.every((col) => col.width != null);
  const fixedTableWidth = useMemo(() => {
    if (!hasFixedColumnWidths) return undefined;
    return columns.reduce((sum, col) => sum + (col.width ?? 0), 0) + (multiSelect ? 40 : 0);
  }, [columns, hasFixedColumnWidths, multiSelect]);

  const tableStyle: CSSProperties | undefined =
    fixedTableWidth != null
      ? { tableLayout: "fixed", width: fixedTableWidth, minWidth: fixedTableWidth }
      : undefined;

  return (
    <div className={className}>
      {showFilter ? (
        <div className="mantineScrollTableToolbar">
          <TextInput
            placeholder={filterPlaceholder}
            value={filterText}
            onChange={(e) => {
              setFilterText(e.currentTarget.value);
              setPage(1);
            }}
            aria-label="一覧フィルタ"
            size="sm"
          />
        </div>
      ) : null}

      <Table.ScrollContainer
        minWidth={fixedTableWidth ?? minTableWidth}
        type="native"
        className={scrollClassName}
      >
        <Table
          striped={striped}
          highlightOnHover={highlightOnHover}
          withTableBorder
          withColumnBorders
          stickyHeader
          tabularNums
          className={tableClassName}
          style={tableStyle}
        >
          {hasFixedColumnWidths ? (
            <colgroup>
              {multiSelect ? <col style={{ width: 40 }} /> : null}
              {columns.map((col) => (
                <col key={col.key} style={columnWidthStyle(col.width)} />
              ))}
            </colgroup>
          ) : null}
          <Table.Thead>
            <Table.Tr>
              {multiSelect ? (
                <Table.Th className="mantineScrollTableTh mantineScrollTableSelectTh">
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={togglePageSelection}
                    aria-label="表示中の行をすべて選択"
                  />
                </Table.Th>
              ) : null}
              {columns.map((col) =>
                col.sortable !== false ? (
                  <SortableTh
                    key={col.key}
                    label={col.label}
                    active={sortKey === col.key}
                    dir={sortDir}
                    width={col.width}
                    onClick={() => handleSort(col.key)}
                  />
                ) : (
                  <Table.Th key={col.key} className="mantineScrollTableTh" style={columnWidthStyle(col.width)}>
                    {col.label}
                  </Table.Th>
                )
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading && displayRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={colSpan} className="mantineScrollTableEmpty">
                  {loadingMessage}
                </Table.Td>
              </Table.Tr>
            ) : displayRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={colSpan} className="mantineScrollTableEmpty">
                  {emptyMessage}
                </Table.Td>
              </Table.Tr>
            ) : (
              displayRows.map((row) => {
                const rowId = getRowId(row);
                const selectedSingle = selectedRowId === rowId;
                const selectedMulti = selectedRowIds?.has(rowId) ?? false;
                const selected = multiSelect ? selectedMulti : selectedSingle;
                return (
                  <Table.Tr
                    key={rowId}
                    className={selected ? "mantineScrollTableRowSelected" : undefined}
                    onClick={!multiSelect && onRowSelect ? () => onRowSelect(row) : undefined}
                    style={!multiSelect && onRowSelect ? { cursor: "pointer" } : undefined}
                    aria-selected={multiSelect || onRowSelect ? selected : undefined}
                  >
                    {multiSelect ? (
                      <Table.Td className="mantineScrollTableSelectTd" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedMulti}
                          onChange={() => toggleRowSelection(rowId)}
                          aria-label={`行 ${rowId} を選択`}
                        />
                      </Table.Td>
                    ) : null}
                    {columns.map((col) => (
                      <Table.Td key={col.key} ta={col.align} style={columnWidthStyle(col.width)}>
                        {col.render(row)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group justify="space-between" align="center" mt="xs" wrap="wrap" className="mantineScrollTableFooter">
        <Text size="sm" c="dimmed">
          {countLabel}
        </Text>
        {paged && sortedRows.length > 0 ? (
          <Pagination total={totalPages} value={paginationCtl.active} onChange={paginationCtl.setPage} />
        ) : null}
      </Group>
    </div>
  );
}
