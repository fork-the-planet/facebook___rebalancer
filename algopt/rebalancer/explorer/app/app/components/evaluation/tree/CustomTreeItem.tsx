'use client';

import {forwardRef, useContext} from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import {TreeItem} from '@mui/x-tree-view/TreeItem';
import type {TreeItemProps} from '@mui/x-tree-view/TreeItem';

import {precise} from '@/lib/format';
import type {
  OrderDirection,
  TreeNodeOrderMetric,
} from '@/lib/rebalancer-explorer-types';

import CollapsibleText from '../CollapsibleText';

import {
  CONTROLS_MORE_PREFIX,
  CONTROLS_PREFIX,
  DEFAULT_SORT,
  PLACEHOLDER_SUFFIX,
  SHOW_MORE_PREFIX,
  SORT_CONTROLS_PREFIX,
} from './constants';
import {NodeDelta} from './NodeDelta';
import {NodeSearchInput} from './NodeSearchInput';
import {PropertyList} from './PropertyList';
import {TreeDataContext} from './TreeDataContext';

export const CustomTreeItem = forwardRef<HTMLLIElement, TreeItemProps>(
  function CustomTreeItem(props, ref) {
    const {itemId, ...rest} = props;
    const {
      nodeData,
      nodeMeta,
      expandedItems,
      onShowMore,
      nodeSearch,
      onSearchChange,
      nodeSort,
      onSortChange,
    } = useContext(TreeDataContext);

    // Legacy prefixes (kept for safety, shouldn't be reached)
    if (
      itemId.startsWith(SHOW_MORE_PREFIX) ||
      itemId.startsWith(SORT_CONTROLS_PREFIX)
    ) {
      return <TreeItem {...rest} ref={ref} itemId={itemId} label={null} />;
    }

    // Combined controls row: "Show more" + sort selectors
    if (
      itemId.startsWith(CONTROLS_PREFIX) ||
      itemId.startsWith(CONTROLS_MORE_PREFIX)
    ) {
      const hasMore = itemId.startsWith(CONTROLS_MORE_PREFIX);
      const parentId = itemId.slice(
        hasMore ? CONTROLS_MORE_PREFIX.length : CONTROLS_PREFIX.length,
      );
      const currentSort = nodeSort[parentId] ?? DEFAULT_SORT;
      const cached = nodeData[parentId];
      const hasSort = cached?.children != null && cached.children.length > 1;

      return (
        <TreeItem
          {...rest}
          ref={ref}
          itemId={itemId}
          className="tree-controls-node"
          label={
            <div onClick={e => e.stopPropagation()}>
              <Box
                sx={{display: 'flex', alignItems: 'center', gap: 1, py: 0.5}}>
                {hasMore && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={e => {
                      e.stopPropagation();
                      onShowMore(parentId);
                    }}>
                    Show more
                  </Button>
                )}
                {hasSort && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ml: hasMore ? 1 : 0}}>
                      Order by:
                    </Typography>
                    <Select
                      size="small"
                      value={currentSort.metric}
                      onChange={e =>
                        onSortChange(
                          parentId,
                          Number(e.target.value) as TreeNodeOrderMetric,
                          currentSort.direction,
                        )
                      }
                      sx={{
                        fontSize: '0.7rem',
                        minWidth: 120,
                        '& .MuiSelect-select': {py: 0.25},
                      }}>
                      <MenuItem value={0}>Source value</MenuItem>
                      <MenuItem value={1}>Destination value</MenuItem>
                      <MenuItem value={2}>Delta value</MenuItem>
                    </Select>
                    <Select
                      size="small"
                      value={currentSort.direction}
                      onChange={e =>
                        onSortChange(
                          parentId,
                          currentSort.metric,
                          Number(e.target.value) as OrderDirection,
                        )
                      }
                      sx={{
                        fontSize: '0.7rem',
                        minWidth: 100,
                        '& .MuiSelect-select': {py: 0.25},
                      }}>
                      <MenuItem value={0}>Ascending</MenuItem>
                      <MenuItem value={1}>Descending</MenuItem>
                    </Select>
                  </>
                )}
              </Box>
            </div>
          }
        />
      );
    }

    // Loading placeholder
    if (itemId.endsWith(PLACEHOLDER_SUFFIX)) {
      return (
        <TreeItem
          {...rest}
          ref={ref}
          itemId={itemId}
          label={
            <Box sx={{display: 'flex', alignItems: 'center', py: 0.5}}>
              <CircularProgress size={14} sx={{mr: 1}} />
              <Typography variant="body2" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          }
        />
      );
    }

    // Regular node
    const cached = nodeData[itemId];
    const meta = nodeMeta[itemId];

    // No data yet — show loading or error
    if (cached?.node == null) {
      return (
        <TreeItem
          {...rest}
          ref={ref}
          itemId={itemId}
          label={
            cached?.loading ? (
              <Box sx={{display: 'flex', alignItems: 'center', py: 0.5}}>
                <CircularProgress size={14} sx={{mr: 1}} />
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            ) : cached?.error != null ? (
              <Alert severity="error" sx={{my: 0.5}}>
                {cached.error}
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                ...
              </Typography>
            )
          }
        />
      );
    }

    const node = cached.node;
    const coeff = meta?.coefficient ?? 1;
    const isMinimizing = meta?.minimizing ?? true;
    const sourceValue = coeff * node.sourceValue;
    const destinationValue = coeff * node.destinationValue;
    const isExpanded = expandedItems.includes(itemId);
    const isLeaf = cached.fetched && cached.children.length === 0;

    return (
      <TreeItem
        {...rest}
        ref={ref}
        itemId={itemId}
        label={
          <Box>
            {/* Node heading + inline search */}
            <Box sx={{display: 'flex', alignItems: 'center', py: 0.5}}>
              <Typography
                variant="body2"
                sx={{fontWeight: 700, fontSize: '0.8125rem', mr: 1}}>
                {coeff !== 1 && `${precise(coeff)} × `}
                {node.expressionType.toUpperCase()}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                }}>
                {precise(sourceValue)}
              </Typography>
              <NodeDelta
                sourceValue={sourceValue}
                destinationValue={destinationValue}
                minimizing={isMinimizing}
              />
              {isExpanded && (
                <NodeSearchInput
                  itemId={itemId}
                  nodeSearch={nodeSearch}
                  onSearchChange={onSearchChange}
                />
              )}
            </Box>
            {/* Description */}
            {node.description !== '' && (
              <Box
                color="text.secondary"
                sx={{fontWeight: 600}}
                onClick={e => e.stopPropagation()}>
                <CollapsibleText text={node.description} clampLines={3} />
              </Box>
            )}
            {/* Properties (shown when expanded, or always for leaf nodes) */}
            {node.properties != null &&
              node.properties.length > 0 &&
              (isExpanded || isLeaf) && (
                <PropertyList properties={node.properties} />
              )}
            {/* Updating indicator */}
            {cached.loading && (
              <Box sx={{display: 'flex', alignItems: 'center', py: 0.5}}>
                <CircularProgress size={14} sx={{mr: 0.5}} />
                <Typography variant="caption" color="text.secondary">
                  Updating...
                </Typography>
              </Box>
            )}
          </Box>
        }
      />
    );
  },
);
