'use client';

import type {Dispatch, SetStateAction} from 'react';
import {useCallback, useMemo} from 'react';

import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import {Box, Paper, TablePagination, Typography} from '@mui/material';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ColumnPinButton,
  getPinnedColumnHelpers,
  PINNED_SHADOW,
  useColumnPinning,
} from '@/app/components/columnPinning';
import {
  ColumnHideButton,
  getColumnHiding,
} from '@/app/components/columnVisibility';

import type {CellData, Result} from '@/lib/rebalancer-explorer-types';
import {ColumnType, OrderDirection} from '@/lib/rebalancer-explorer-types';
import {isNumericColumn} from '@/lib/format';
import {
  CARD_SHADOW,
  LINE_COLOR,
  MUTED_TEXT_COLOR,
  ROW_HOVER_OPAQUE,
} from '@/lib/ui-tokens';

import type {ViewState} from './EntityView';
import CopyCellAffordance from './CopyCellAffordance';
import UpdatingOverlay from './UpdatingOverlay';
import useCopyOnClick from './useCopyOnClick';

interface EntityTableProps {
  result: Result | null;
  viewState: ViewState;
  onViewStateChange: Dispatch<SetStateAction<ViewState>>;
  loading: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getColumnTypeLabel(type: ColumnType): {
  label: string;
  full: string;
  color: string;
} {
  switch (type) {
    case ColumnType.DIMENSION:
      return {label: 'dim', full: 'Dimension', color: '#e3f2fd'};
    case ColumnType.UTILIZATION:
      return {label: 'util', full: 'Utilization', color: '#fff3e0'};
    case ColumnType.ENTITY_NAME:
      return {label: 'entity', full: 'Entity name', color: '#e8f5e9'};
    case ColumnType.ASSIGNMENT:
      return {label: 'assign', full: 'Assignment', color: '#fce4ec'};
    case ColumnType.PARTITION:
      return {label: 'part', full: 'Partition', color: '#f3e5f5'};
    case ColumnType.SCOPE:
      return {label: 'scope', full: 'Scope', color: '#e0f2f1'};
    case ColumnType.IDENTIFIER:
      return {label: 'id', full: 'Identifier', color: '#e8eaf6'};
    case ColumnType.DOUBLE:
      return {label: 'double', full: 'Double', color: '#f5f5f5'};
    case ColumnType.INTEGER:
      return {label: 'int', full: 'Integer', color: '#f5f5f5'};
    case ColumnType.STRING:
      return {label: 'string', full: 'String', color: '#f5f5f5'};
    default:
      return {label: '', full: '', color: 'transparent'};
  }
}

// Column width sized to the value/type; long header names wrap within it.
function getColumnWidth(type: ColumnType, isPrimaryKey: boolean): number {
  if (isPrimaryKey) {
    return 220;
  }
  switch (type) {
    case ColumnType.DOUBLE:
    case ColumnType.UTILIZATION:
      return 170;
    case ColumnType.INTEGER:
      return 150;
    case ColumnType.PARTITION:
    case ColumnType.SCOPE:
    case ColumnType.ASSIGNMENT:
      return 160;
    case ColumnType.DIMENSION:
      return 180;
    case ColumnType.ENTITY_NAME:
    case ColumnType.IDENTIFIER:
      return 200;
    case ColumnType.STRING:
    default:
      return 180;
  }
}

function formatCellValue(cell: CellData | undefined): string {
  if (cell == null) {
    return '-';
  }
  if (cell.doubleValue != null) {
    const num = Number(cell.doubleValue);
    if (Number.isInteger(num)) {
      return String(num);
    }
    return num.toFixed(4);
  }
  if (cell.stringValue != null) {
    return cell.stringValue;
  }
  return '-';
}

/**
 * Split a header name into multiple lines at `.` boundaries.
 * e.g. "host_count.initUtil" → ["host_count", ".initUtil"]
 */
function splitHeaderName(name: string): string[] {
  const parts = name.split('.');
  if (parts.length <= 1) {
    return [name];
  }
  return parts.map((part, i) => (i === 0 ? part : `.${part}`));
}

type RowData = Record<string, CellData | undefined>;

const columnHelper = createColumnHelper<RowData>();

/**
 * EntityTable renders entity data in a sortable, paginated table with column pinning.
 * All sorting and pagination is server-side via callbacks to the parent.
 */
export default function EntityTable({
  result,
  viewState,
  onViewStateChange,
  loading,
}: EntityTableProps) {
  const {copyOnClick, copyOnKeyDown, snackbar} = useCopyOnClick();

  // Use the result's own columns for rendering — these reflect the actual
  // columns returned by the backend (which change when group-by is active,
  // since non-group-by string columns are dropped and IDENTIFIER becomes
  // Row_Count).
  const resultColumns = result?.columns ?? [];

  // Determine which columns are visible. When showColumns is non-empty,
  // entity name and group-by columns are always shown alongside the
  // explicitly-selected columns (matching the legacy projection behavior).
  const visibleColumnIndices = useMemo(() => {
    if (viewState.showColumns.length === 0) {
      return resultColumns.map((_, i) => i);
    }
    return resultColumns
      .map((col, i) => ({col, i}))
      .filter(
        ({col}) =>
          col.type === ColumnType.ENTITY_NAME ||
          viewState.showColumns.includes(col.name) ||
          viewState.groupByColumns.includes(col.name),
      )
      .map(({i}) => i);
  }, [resultColumns, viewState.showColumns, viewState.groupByColumns]);

  // Build TanStack columns from visible column descriptions
  const columns = useMemo(() => {
    return visibleColumnIndices.map(colIndex => {
      const col = resultColumns[colIndex];
      return columnHelper.accessor(String(colIndex), {
        id: String(colIndex),
        header: col.name,
        cell: info => formatCellValue(info.getValue()),
        size: getColumnWidth(col.type, col.primaryKey),
        minSize: 80,
        meta: {
          numeric: isNumericColumn(col.type),
          primaryKey: col.primaryKey,
          colName: col.name,
          colType: col.type,
        },
      });
    });
  }, [visibleColumnIndices, resultColumns]);

  // Build row data
  const data = useMemo<RowData[]>(() => {
    if (result == null) {
      return [];
    }
    return result.rows.map(row => {
      const rowObj: RowData = {};
      resultColumns.forEach((_col, colIndex) => {
        rowObj[String(colIndex)] = row.cells[colIndex];
      });
      return rowObj;
    });
  }, [result, resultColumns]);

  // Column pinning state — primary key columns pinned by default
  const defaultPinnedIds = useMemo(() => {
    return resultColumns
      .map((col, i) => ({col, i}))
      .filter(({col, i}) => col.primaryKey && visibleColumnIndices.includes(i))
      .map(({i}) => String(i));
  }, [resultColumns, visibleColumnIndices]);

  const {columnPinning, setColumnPinning, togglePin} =
    useColumnPinning(defaultPinnedIds);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnPinning,
    },
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    columnResizeMode: 'onChange',
  });

  const handleSort = useCallback(
    (colIndex: string) => {
      const col = resultColumns[parseInt(colIndex, 10)];
      if (col == null) {
        return;
      }
      onViewStateChange(prev => {
        if (prev.orderColumn === col.name) {
          // Toggle direction
          if (prev.orderDirection === OrderDirection.ASCENDING) {
            return {
              ...prev,
              orderDirection: OrderDirection.DESCENDING,
              offset: 0,
            };
          }
          // Clear sort on third click
          return {...prev, orderColumn: null, offset: 0};
        }
        return {
          ...prev,
          orderColumn: col.name,
          orderDirection: OrderDirection.ASCENDING,
          offset: 0,
        };
      });
    },
    [resultColumns, onViewStateChange],
  );

  const currentPage = Math.floor(viewState.offset / viewState.limit);
  const totalCount = result?.totalCount ?? 0;

  const handlePageChange = useCallback(
    (_event: unknown, newPage: number) => {
      onViewStateChange(prev => ({
        ...prev,
        offset: newPage * prev.limit,
      }));
    },
    [onViewStateChange],
  );

  const handleRowsPerPageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newSize = parseInt(event.target.value, 10);
      onViewStateChange(prev => ({
        ...prev,
        limit: newSize,
        offset: 0,
      }));
    },
    [onViewStateChange],
  );

  if (result == null) {
    return null;
  }

  const pinnedLeft = columnPinning.left ?? [];
  const {stickyStyle, isLastPinned} = getPinnedColumnHelpers(table, pinnedLeft);
  const hiding = getColumnHiding(
    resultColumns,
    viewState.groupByColumns,
    viewState.showColumns,
  );

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: CARD_SHADOW,
      }}>
      {/* Keeps the old rows visible while refetching */}
      {loading && <UpdatingOverlay />}

      {/* Scroll wide tables sideways; the page handles vertical scrolling. */}
      <Box sx={{overflowX: 'auto'}}>
        {data.length === 0 && !loading ? (
          <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
            <Typography variant="body1" color="text.secondary">
              No data found
            </Typography>
          </Box>
        ) : (
          <table
            style={{
              width: table.getTotalSize(),
              minWidth: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
            }}>
            <thead>
              {headerGroups.map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const meta = header.column.columnDef.meta as
                      | {
                          numeric?: boolean;
                          primaryKey?: boolean;
                          colName?: string;
                          colType?: ColumnType;
                        }
                      | undefined;
                    const isPinned = pinnedLeft.includes(header.column.id);
                    const isSorted = viewState.orderColumn === meta?.colName;
                    const isAsc =
                      isSorted &&
                      viewState.orderDirection === OrderDirection.ASCENDING;

                    return (
                      <th
                        key={header.id}
                        style={{
                          position: 'relative',
                          ...stickyStyle(header.column.id, 3),
                          width: header.getSize(),
                          maxWidth: header.getSize(),
                          minWidth: header.column.columnDef.minSize,
                          textAlign: 'center',
                          padding: '8px 12px',
                          borderBottom: `1px solid ${LINE_COLOR}`,
                          fontWeight: meta?.primaryKey ? 600 : 500,
                          fontSize: '0.875rem',
                          color: MUTED_TEXT_COLOR,
                          cursor: 'pointer',
                          userSelect: 'none',
                          backgroundColor: 'white',
                          boxShadow: isLastPinned(header.column.id)
                            ? PINNED_SHADOW
                            : undefined,
                        }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                            overflow: 'hidden',
                            minWidth: 0,
                          }}>
                          <span
                            onClick={() => handleSort(header.column.id)}
                            title={meta?.colName ?? ''}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              minWidth: 0,
                              overflow: 'hidden',
                            }}>
                            <span
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                              }}>
                              {splitHeaderName(
                                String(
                                  flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  ),
                                ),
                              ).map((part, i) => (
                                <span
                                  key={i}
                                  style={{
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word',
                                  }}>
                                  {part}
                                </span>
                              ))}
                              {meta?.colType != null &&
                                (() => {
                                  const {label, full, color} =
                                    getColumnTypeLabel(meta.colType);
                                  if (!label) return null;
                                  return (
                                    <span
                                      title={full}
                                      style={{
                                        fontSize: '0.625rem',
                                        lineHeight: 1,
                                        padding: '1px 4px',
                                        borderRadius: 3,
                                        backgroundColor: color,
                                        color: '#666',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        alignSelf: 'center',
                                        marginTop: 2,
                                      }}>
                                      {label}
                                    </span>
                                  );
                                })()}
                            </span>
                            {isSorted &&
                              (isAsc ? (
                                <ArrowUpward
                                  sx={{fontSize: 16, flexShrink: 0}}
                                />
                              ) : (
                                <ArrowDownward
                                  sx={{fontSize: 16, flexShrink: 0}}
                                />
                              ))}
                          </span>
                          <ColumnPinButton
                            pinned={isPinned}
                            onToggle={() => togglePin(header.column.id)}
                            label={
                              isPinned
                                ? `Unpin ${meta?.colName}`
                                : `Pin ${meta?.colName}`
                            }
                          />
                          {meta?.colName != null &&
                            hiding.isHideable(meta.colName) && (
                              <ColumnHideButton
                                colName={meta.colName}
                                pinned={isPinned}
                                hideDisabled={hiding.hideDisabled}
                                onHide={() =>
                                  onViewStateChange(prev => ({
                                    ...prev,
                                    showColumns: hiding.hideColumn(
                                      meta.colName!,
                                      prev.showColumns,
                                    ),
                                    offset: 0,
                                  }))
                                }
                              />
                            )}
                        </Box>
                        {/* Resize handle */}
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            width: 4,
                            cursor: 'col-resize',
                            backgroundColor: header.column.getIsResizing()
                              ? '#1976d2'
                              : 'transparent',
                          }}
                          onMouseEnter={e => {
                            if (!header.column.getIsResizing()) {
                              e.currentTarget.style.backgroundColor = '#bdbdbd';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!header.column.getIsResizing()) {
                              e.currentTarget.style.backgroundColor =
                                'transparent';
                            }
                          }}
                        />
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: 'white',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = ROW_HOVER_OPAQUE;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}>
                  {row.getVisibleCells().map(cell => {
                    const meta = cell.column.columnDef.meta as
                      | {numeric?: boolean; primaryKey?: boolean}
                      | undefined;
                    const isPinned = pinnedLeft.includes(cell.column.id);

                    return (
                      <td
                        key={cell.id}
                        className="group"
                        onClick={copyOnClick}
                        onKeyDown={copyOnKeyDown}
                        tabIndex={0}
                        style={{
                          position: 'relative',
                          ...stickyStyle(cell.column.id, 2),
                          width: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                          textAlign: meta?.numeric ? 'center' : 'left',
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingLeft: 12,
                          // Extra right room for the copy icon.
                          paddingRight: 24,
                          borderBottom: `1px solid ${LINE_COLOR}`,
                          fontWeight: meta?.primaryKey ? 600 : 400,
                          fontSize: '0.875rem',
                          fontVariantNumeric: meta?.numeric
                            ? 'tabular-nums'
                            : undefined,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          cursor: 'pointer',
                          backgroundColor: isPinned ? 'inherit' : undefined,
                          boxShadow: isLastPinned(cell.column.id)
                            ? PINNED_SHADOW
                            : undefined,
                        }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                        <CopyCellAffordance />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Box>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={currentPage}
        onPageChange={handlePageChange}
        rowsPerPage={viewState.limit}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        sx={{
          borderTop: 1,
          borderTopColor: 'divider',
          flexShrink: 0,
          '& .MuiTablePagination-spacer': {display: 'none'},
          '& .MuiTablePagination-toolbar': {justifyContent: 'flex-start'},
        }}
      />

      {snackbar}
    </Paper>
  );
}
