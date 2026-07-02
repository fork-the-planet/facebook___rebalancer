/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  CellData,
  ColumnDescription,
  RowData,
} from '@/lib/rebalancer-explorer-types';

export interface MoveOverride {
  variable: string;
  container: string;
}

export interface SelectedMoveData {
  variable: string;
  srcContainer: string;
  dstContainer: string;
}

/**
 * Given table rows, a set of selected row indices, column descriptions,
 * and a container column name (Source/Destination Container), extracts
 * {variable, container} move objects.
 */
export function extractMovesFromRows(
  rows: RowData[],
  columns: ColumnDescription[],
  selectedRowIndices: Set<number>,
  containerColumn: 'Destination Container' | 'Source Container',
): MoveOverride[] {
  const objectColIndex = columns.findIndex(c => c.name === 'Object');
  const containerColIndex = columns.findIndex(c => c.name === containerColumn);

  if (objectColIndex === -1 || containerColIndex === -1) {
    return [];
  }

  const moves: MoveOverride[] = [];
  for (const rowIndex of selectedRowIndices) {
    const row = rows[rowIndex];
    if (row == null) {
      continue;
    }
    const variable = getCellStringValue(row.cells[objectColIndex]);
    const container = getCellStringValue(row.cells[containerColIndex]);
    if (variable != null && container != null) {
      moves.push({variable, container});
    }
  }
  return moves;
}

/**
 * Merges new moves into existing overrides with deduplication
 * (same variable+container pair won't be added twice).
 */
export function mergeOverrides(
  existing: ReadonlyArray<MoveOverride>,
  newMoves: ReadonlyArray<MoveOverride>,
): MoveOverride[] {
  const deduped = newMoves.filter(
    m =>
      !existing.some(
        o => o.variable === m.variable && o.container === m.container,
      ),
  );
  return [...existing, ...deduped];
}

/**
 * Extract SelectedMoveData from a single row, or null if required columns
 * are missing.
 */
export function extractMoveDataFromRow(
  row: RowData,
  columns: ColumnDescription[],
): SelectedMoveData | null {
  const objectColIndex = columns.findIndex(c => c.name === 'Object');
  const srcColIndex = columns.findIndex(c => c.name === 'Source Container');
  const dstColIndex = columns.findIndex(
    c => c.name === 'Destination Container',
  );

  if (objectColIndex === -1 || srcColIndex === -1 || dstColIndex === -1) {
    return null;
  }

  const variable = getCellStringValue(row.cells[objectColIndex]);
  const srcContainer = getCellStringValue(row.cells[srcColIndex]);
  const dstContainer = getCellStringValue(row.cells[dstColIndex]);

  if (variable == null || srcContainer == null || dstContainer == null) {
    return null;
  }

  return {variable, srcContainer, dstContainer};
}

/**
 * Convert stored selection data into MoveOverride[] for a given container direction.
 */
export function movesFromSelection(
  selectedMoves: ReadonlyMap<number, SelectedMoveData>,
  containerColumn: 'Destination Container' | 'Source Container',
): MoveOverride[] {
  const moves: MoveOverride[] = [];
  for (const data of selectedMoves.values()) {
    const container =
      containerColumn === 'Destination Container'
        ? data.dstContainer
        : data.srcContainer;
    moves.push({variable: data.variable, container});
  }
  return moves;
}

function getCellStringValue(cell: CellData | undefined): string | undefined {
  return cell?.stringValue ?? undefined;
}
