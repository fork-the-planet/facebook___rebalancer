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

import {describe, expect, it} from 'vitest';

import {ColumnType} from '@/lib/rebalancer-explorer-types';
import type {ColumnDescription, RowData} from '@/lib/rebalancer-explorer-types';
import {
  extractMoveDataFromRow,
  mergeOverrides,
  movesFromSelection,
} from '@/lib/move-selection-utils';
import type {SelectedMoveData} from '@/lib/move-selection-utils';

const COLUMNS: ColumnDescription[] = [
  {
    name: 'Object',
    type: ColumnType.ENTITY_NAME,
    primaryKey: true,
    description: '',
  },
  {
    name: 'Source Container',
    type: ColumnType.ENTITY_NAME,
    primaryKey: false,
    description: '',
  },
  {
    name: 'Destination Container',
    type: ColumnType.ENTITY_NAME,
    primaryKey: false,
    description: '',
  },
  {name: 'Delta', type: ColumnType.DOUBLE, primaryKey: false, description: ''},
];

function row(obj: string, src: string, dst: string): RowData {
  return {
    cells: [
      {stringValue: obj},
      {stringValue: src},
      {stringValue: dst},
      {doubleValue: 1.0},
    ],
  };
}

describe('extractMoveDataFromRow', () => {
  it('extracts variable and both containers from a row', () => {
    const result = extractMoveDataFromRow(row('obj1', 'cA', 'cB'), COLUMNS);
    expect(result).toEqual({
      variable: 'obj1',
      srcContainer: 'cA',
      dstContainer: 'cB',
    });
  });

  it('returns null when Object column is missing', () => {
    const cols = COLUMNS.filter(c => c.name !== 'Object');
    const result = extractMoveDataFromRow(row('obj1', 'cA', 'cB'), cols);
    expect(result).toBeNull();
  });

  it('returns null when Source Container column is missing', () => {
    const cols = COLUMNS.filter(c => c.name !== 'Source Container');
    const result = extractMoveDataFromRow(row('obj1', 'cA', 'cB'), cols);
    expect(result).toBeNull();
  });

  it('returns null when a cell value is undefined', () => {
    const r: RowData = {
      cells: [{}, {stringValue: 'cA'}, {stringValue: 'cB'}, {}],
    };
    const result = extractMoveDataFromRow(r, COLUMNS);
    expect(result).toBeNull();
  });
});

describe('movesFromSelection', () => {
  const data: SelectedMoveData = {
    variable: 'obj1',
    srcContainer: 'cA',
    dstContainer: 'cB',
  };
  const data2: SelectedMoveData = {
    variable: 'obj2',
    srcContainer: 'cC',
    dstContainer: 'cD',
  };

  it('extracts destination container moves', () => {
    const selected = new Map([
      [0, data],
      [5, data2],
    ]);
    const moves = movesFromSelection(selected, 'Destination Container');
    expect(moves).toEqual([
      {variable: 'obj1', container: 'cB'},
      {variable: 'obj2', container: 'cD'},
    ]);
  });

  it('extracts source container moves (revert)', () => {
    const selected = new Map([
      [0, data],
      [5, data2],
    ]);
    const moves = movesFromSelection(selected, 'Source Container');
    expect(moves).toEqual([
      {variable: 'obj1', container: 'cA'},
      {variable: 'obj2', container: 'cC'},
    ]);
  });

  it('returns empty array for empty selection', () => {
    const moves = movesFromSelection(new Map(), 'Destination Container');
    expect(moves).toEqual([]);
  });
});

describe('mergeOverrides', () => {
  it('appends new moves', () => {
    const existing = [{variable: 'a', container: 'x'}];
    const result = mergeOverrides(existing, [{variable: 'b', container: 'y'}]);
    expect(result).toEqual([
      {variable: 'a', container: 'x'},
      {variable: 'b', container: 'y'},
    ]);
  });

  it('deduplicates by variable+container', () => {
    const existing = [{variable: 'a', container: 'x'}];
    const result = mergeOverrides(existing, [{variable: 'a', container: 'x'}]);
    expect(result).toEqual([{variable: 'a', container: 'x'}]);
  });

  it('keeps moves with same variable but different container', () => {
    const existing = [{variable: 'a', container: 'x'}];
    const result = mergeOverrides(existing, [{variable: 'a', container: 'y'}]);
    expect(result).toHaveLength(2);
  });
});
