'use client';

import {useCallback, useState} from 'react';

import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import {IconButton} from '@mui/material';
import type {ColumnPinningState, Table, Updater} from '@tanstack/react-table';

// Tracks which columns are pinned (kept fixed on the left while the other
// columns scroll sideways). Pass the result into the table.
export function useColumnPinning(defaultPinnedIds: string[]) {
  // Defaults come from the columns, which are empty until data loads, so seeding
  // state once would leave them unpinned. Derive from the defaults until the user
  // or table overrides, then honor the override.
  const [override, setOverride] = useState<ColumnPinningState | null>(null);
  const columnPinning: ColumnPinningState = override ?? {
    left: defaultPinnedIds,
    right: [],
  };
  const setColumnPinning = useCallback(
    (updater: Updater<ColumnPinningState>) => {
      setOverride(prev => {
        const base = prev ?? {left: defaultPinnedIds, right: []};
        return typeof updater === 'function' ? updater(base) : updater;
      });
    },
    [defaultPinnedIds],
  );
  const togglePin = useCallback(
    (colId: string) => {
      setColumnPinning(old => {
        const left = old.left ?? [];
        return left.includes(colId)
          ? {...old, left: left.filter(id => id !== colId)}
          : {...old, left: [...left, colId]};
      });
    },
    [setColumnPinning],
  );
  return {columnPinning, setColumnPinning, togglePin};
}

// Works out where each pinned column sits so they line up against the left edge
// as the rest scroll. Call during render (needs the table).
export function getPinnedColumnHelpers<T>(table: Table<T>, pinnedLeft: string[]) {
  const offsets: Record<string, number> = {};
  let acc = 0;
  for (const colId of pinnedLeft) {
    const col = table.getColumn(colId);
    if (col) {
      offsets[colId] = acc;
      acc += col.getSize();
    }
  }
  const stickyStyle = (colId: string, zIndex: number): React.CSSProperties =>
    pinnedLeft.includes(colId)
      ? {position: 'sticky', left: offsets[colId] ?? 0, zIndex}
      : {};
  const isLastPinned = (colId: string) =>
    pinnedLeft.length > 0 && pinnedLeft[pinnedLeft.length - 1] === colId;
  return {stickyStyle, isLastPinned};
}

// Shadow on the right of the pinned columns, separating them from the ones that
// scroll underneath.
export const PINNED_SHADOW = '4px 0 8px -2px rgba(0,0,0,0.15)';

export function ColumnPinButton({
  pinned,
  onToggle,
  label,
}: {
  pinned: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <IconButton
      size="small"
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      sx={{
        p: 0.25,
        flexShrink: 0,
        opacity: pinned ? 1 : 0.3,
        '&:hover': {opacity: 1},
      }}
      aria-label={label}>
      {pinned ? (
        <PushPin sx={{fontSize: 16}} />
      ) : (
        <PushPinOutlined sx={{fontSize: 16}} />
      )}
    </IconButton>
  );
}
