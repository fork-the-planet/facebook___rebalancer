'use client';

import type {Dispatch, SetStateAction} from 'react';
import {useCallback, useMemo, useState} from 'react';

import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TablePagination,
  Typography,
} from '@mui/material';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {ColumnPinningState} from '@tanstack/react-table';

import type {CellData, Result} from '@/lib/rebalancer-explorer-types';
import {ColumnType, OrderDirection} from '@/lib/rebalancer-explorer-types';
import {isNumericColumn} from '@/lib/format';

import type {ViewState} from './EntityView';
import useCopyOnClick from './useCopyOnClick';

interface EntityTableProps {
  result: Result | null;
  viewState: ViewState;
  onViewStateChange: Dispatch<SetStateAction<ViewState>>;
  loading: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getColumnTypeLabel(type: ColumnType): {label: string; color: string} {
  switch (type) {
    case ColumnType.DIMENSION:
      return {label: 'dim', color: '#e3f2fd'};
    case ColumnType.UTILIZATION:
      return {label: 'util', color: '#fff3e0'};
    case ColumnType.ENTITY_NAME:
      return {label: 'entity', color: '#e8f5e9'};
    case ColumnType.ASSIGNMENT:
      return {label: 'assign', color: '#fce4ec'};
    case ColumnType.PARTITION:
      return {label: 'part', color: '#f3e5f5'};
    case ColumnType.SCOPE:
      return {label: 'scope', color: '#e0f2f1'};
    case ColumnType.IDENTIFIER:
      return {label: 'id', color: '#e8eaf6'};
    case ColumnType.DOUBLE:
      return {label: 'double', color: '#f5f5f5'};
    case ColumnType.INTEGER:
      return {label: 'int', color: '#f5f5f5'};
    case ColumnType.STRING:
      return {label: 'string', color: '#f5f5f5'};
    default:
      return {label: '', color: 'transparent'};
  }
}

function getColumnWidth(type: ColumnType, isPrimaryKey: boolean): number {
  if (isPrimaryKey) {
    return 220;
  }
  switch (type) {
    case ColumnType.DOUBLE:
    case ColumnType.UTILIZATION:
      return 130;
    case ColumnType.INTEGER:
      return 110;
    case ColumnType.PARTITION:
    case ColumnType.SCOPE:
    case ColumnType.ASSIGNMENT:
      return 150;
    case ColumnType.DIMENSION:
      return 160;
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

  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: defaultPinnedIds,
    right: [],
  });

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

  const togglePin = useCallback((colId: string) => {
    setColumnPinning(prev => {
      const left = prev.left ?? [];
      if (left.includes(colId)) {
        return {...prev, left: left.filter(id => id !== colId)};
      }
      return {...prev, left: [...left, colId]};
    });
  }, []);

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

  // Compute left offsets for pinned columns
  const pinnedLeft = columnPinning.left ?? [];
  const pinnedLeftOffsets: Record<string, number> = {};
  let cumulativeOffset = 0;
  for (const colId of pinnedLeft) {
    const col = table.getColumn(colId);
    if (col) {
      pinnedLeftOffsets[colId] = cumulativeOffset;
      cumulativeOffset += col.getSize();
    }
  }

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  const getStickyStyles = (colId: string): React.CSSProperties => {
    if (!pinnedLeft.includes(colId)) {
      return {};
    }
    return {
      position: 'sticky',
      left: pinnedLeftOffsets[colId] ?? 0,
      zIndex: 2,
      backgroundColor: 'inherit',
    };
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        height: 650,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 10,
          }}>
          <CircularProgress />
        </Box>
      )}

      {/* Scrollable table area */}
      <Box sx={{flex: 1, overflow: 'auto'}}>
        {data.length === 0 && !loading ? (
          <Box className="flex h-full items-center justify-center">
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

                    // Shadow on last pinned column
                    const isLastPinned =
                      isPinned &&
                      pinnedLeft[pinnedLeft.length - 1] === header.column.id;

                    return (
                      <th
                        key={header.id}
                        style={{
                          width: header.getSize(),
                          maxWidth: header.getSize(),
                          minWidth: header.column.columnDef.minSize,
                          textAlign: meta?.numeric ? 'right' : 'left',
                          padding: '8px 12px',
                          borderBottom: '2px solid #e0e0e0',
                          fontWeight: meta?.primaryKey ? 700 : 600,
                          fontSize: '0.875rem',
                          position: isPinned ? 'sticky' : 'relative',
                          left: isPinned
                            ? (pinnedLeftOffsets[header.column.id] ?? 0)
                            : undefined,
                          zIndex: isPinned ? 3 : undefined,
                          cursor: 'pointer',
                          userSelect: 'none',
                          backgroundColor: '#fafafa',
                          boxShadow: isLastPinned
                            ? '4px 0 8px -2px rgba(0,0,0,0.15)'
                            : undefined,
                        }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: meta?.numeric
                              ? 'flex-end'
                              : 'flex-start',
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
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}>
                                  {part}
                                </span>
                              ))}
                              {meta?.colType != null &&
                                (() => {
                                  const {label, color} = getColumnTypeLabel(
                                    meta.colType,
                                  );
                                  if (!label) return null;
                                  return (
                                    <span
                                      style={{
                                        fontSize: '0.625rem',
                                        lineHeight: 1,
                                        padding: '1px 4px',
                                        borderRadius: 3,
                                        backgroundColor: color,
                                        color: '#666',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        alignSelf: meta.numeric
                                          ? 'flex-end'
                                          : 'flex-start',
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
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              togglePin(header.column.id);
                            }}
                            sx={{
                              p: 0.25,
                              flexShrink: 0,
                              opacity: isPinned ? 1 : 0.3,
                              '&:hover': {opacity: 1},
                            }}
                            aria-label={
                              isPinned
                                ? `Unpin ${meta?.colName}`
                                : `Pin ${meta?.colName}`
                            }>
                            {isPinned ? (
                              <PushPin sx={{fontSize: 16}} />
                            ) : (
                              <PushPinOutlined sx={{fontSize: 16}} />
                            )}
                          </IconButton>
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
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}>
                  {row.getVisibleCells().map(cell => {
                    const meta = cell.column.columnDef.meta as
                      | {numeric?: boolean; primaryKey?: boolean}
                      | undefined;
                    const isPinned = pinnedLeft.includes(cell.column.id);
                    const isLastPinned =
                      isPinned &&
                      pinnedLeft[pinnedLeft.length - 1] === cell.column.id;

                    return (
                      <td
                        key={cell.id}
                        onClick={copyOnClick}
                        onKeyDown={copyOnKeyDown}
                        tabIndex={0}
                        style={{
                          width: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                          ...getStickyStyles(cell.column.id),
                          textAlign: meta?.numeric ? 'right' : 'left',
                          padding: '8px 12px',
                          borderBottom: '1px solid #e0e0e0',
                          fontWeight: meta?.primaryKey ? 600 : 400,
                          fontSize: '0.875rem',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          cursor: 'pointer',
                          boxShadow: isLastPinned
                            ? '4px 0 8px -2px rgba(0,0,0,0.15)'
                            : undefined,
                        }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
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
          borderTop: '1px solid #e0e0e0',
          flexShrink: 0,
          '& .MuiTablePagination-spacer': {display: 'none'},
          '& .MuiTablePagination-toolbar': {justifyContent: 'flex-start'},
        }}
      />

      {snackbar}
    </Paper>
  );
}
