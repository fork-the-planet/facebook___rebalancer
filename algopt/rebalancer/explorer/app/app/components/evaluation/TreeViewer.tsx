'use client';

import {useCallback, useMemo, useState} from 'react';

import AccountTree from '@mui/icons-material/AccountTree';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import {RichTreeView} from '@mui/x-tree-view/RichTreeView';
import type {TreeViewBaseItem} from '@mui/x-tree-view/models';

import {fetchTreeNode} from '@/lib/rebalancer-explorer-api';
import type {
  Assignment,
  Handle,
  OrderDirection,
  TreeNodeOrderMetric,
} from '@/lib/rebalancer-explorer-types';

import {CustomTreeItem} from './tree/CustomTreeItem';
import {
  TreeDataContext,
  type CachedNode,
  type NodeMeta,
  type NodeSort,
  type TreeDataContextValue,
} from './tree/TreeDataContext';

import {
  CONTROLS_MORE_PREFIX,
  CONTROLS_PREFIX,
  DEFAULT_SORT,
  PLACEHOLDER_SUFFIX,
  SHOW_MORE_PREFIX,
  SORT_CONTROLS_PREFIX,
} from './tree/constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_CHILDREN_LIMIT = 10;
const CHILDREN_INCREMENT = 10;

// ---------------------------------------------------------------------------
// TreeViewer (entry point with button + dialog)
// ---------------------------------------------------------------------------

interface TreeViewerProps {
  expressionId: number;
  handle: Handle;
  sourceAssignment: Assignment;
  destinationAssignment: Assignment;
  /** Whether the expression is being minimized. Affects delta color coding. */
  minimizing: boolean;
}

export default function TreeViewer({
  expressionId,
  handle,
  sourceAssignment,
  destinationAssignment,
  minimizing,
}: TreeViewerProps) {
  const [open, setOpen] = useState(false);

  // Node data cache
  const [nodeData, setNodeData] = useState<Record<string, CachedNode>>({});
  const [nodeMeta, setNodeMeta] = useState<Record<string, NodeMeta>>({});
  const [childrenLimits, setChildrenLimits] = useState<Record<string, number>>(
    {},
  );
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Per-node search and sort
  const [nodeSearch, setNodeSearch] = useState<Record<string, string>>({});
  const [nodeSort, setNodeSort] = useState<Record<string, NodeSort>>({});

  // Fetch a tree node and cache the results
  const doFetch = useCallback(
    async (
      nodeId: string,
      limit: number,
      search: string,
      metric: TreeNodeOrderMetric,
      direction: OrderDirection,
    ) => {
      setNodeData(prev => ({
        ...prev,
        [nodeId]: prev[nodeId]
          ? {...prev[nodeId], loading: true, error: null}
          : {
              node: null,
              children: [],
              fetched: false,
              loading: true,
              error: null,
            },
      }));

      try {
        const response = await fetchTreeNode(handle, {
          expressionId: Number(nodeId),
          sourceAssignment,
          destinationAssignment,
          childrenPage: {offset: 0, limit: limit + 1},
          childrenOrderMetric: metric,
          childrenOrderDirection: direction,
          ...(search !== '' ? {search: {query: search}} : {}),
        });

        setNodeData(prev => {
          const updated = {...prev};
          updated[nodeId] = {
            node: response.node,
            children: response.children,
            fetched: true,
            loading: false,
            error: null,
          };
          // Pre-populate child node data from the parent's response
          for (const child of response.children) {
            const childId = String(child.expressionId);
            if (!updated[childId]?.fetched) {
              updated[childId] = {
                node: child,
                children: [],
                fetched: false,
                loading: false,
                error: null,
              };
            }
          }
          return updated;
        });

        // Set coefficient and minimizing for each child
        setNodeMeta(prev => {
          const parentMeta = prev[nodeId] ?? {
            coefficient: 1,
            minimizing: true,
          };
          const updated = {...prev};
          for (const child of response.children) {
            const childId = String(child.expressionId);
            updated[childId] = {
              coefficient: child.coefficient,
              minimizing:
                child.coefficient < 0
                  ? !parentMeta.minimizing
                  : parentMeta.minimizing,
            };
          }
          return updated;
        });
      } catch (err: unknown) {
        setNodeData(prev => ({
          ...prev,
          [nodeId]: {
            node: prev[nodeId]?.node ?? null,
            children: prev[nodeId]?.children ?? [],
            fetched: prev[nodeId]?.fetched ?? false,
            loading: false,
            error:
              err instanceof Error ? err.message : 'Failed to fetch tree node',
          },
        }));
      }
    },
    [handle, sourceAssignment, destinationAssignment],
  );

  // Open dialog: reset state and fetch root
  const handleOpen = useCallback(() => {
    const rootId = String(expressionId);
    setNodeData({});
    setNodeMeta({[rootId]: {coefficient: 1, minimizing}});
    setChildrenLimits({});
    setExpandedItems([rootId]);
    setNodeSearch({});
    setNodeSort({});
    setOpen(true);
    doFetch(rootId, INITIAL_CHILDREN_LIMIT, '', 0, 1);
  }, [expressionId, minimizing, doFetch]);

  // Handle expansion changes — fetch data for newly expanded nodes
  const handleExpandedItemsChange = useCallback(
    (_event: unknown, newExpandedItems: string[]) => {
      const prevExpanded = new Set(expandedItems);
      const newlyExpanded = newExpandedItems.filter(
        id => !prevExpanded.has(id),
      );
      setExpandedItems(newExpandedItems);

      for (const itemId of newlyExpanded) {
        if (
          !itemId.startsWith(SHOW_MORE_PREFIX) &&
          !itemId.endsWith(PLACEHOLDER_SUFFIX) &&
          !nodeData[itemId]?.fetched
        ) {
          const limit = childrenLimits[itemId] ?? INITIAL_CHILDREN_LIMIT;
          const search = nodeSearch[itemId] ?? '';
          const sort = nodeSort[itemId] ?? DEFAULT_SORT;
          doFetch(itemId, limit, search, sort.metric, sort.direction);
        }
      }
    },
    [expandedItems, nodeData, childrenLimits, nodeSearch, nodeSort, doFetch],
  );

  // "Show more" handler — increase limit and re-fetch
  const handleShowMore = useCallback(
    (parentId: string) => {
      const currentLimit = childrenLimits[parentId] ?? INITIAL_CHILDREN_LIMIT;
      const newLimit = currentLimit + CHILDREN_INCREMENT;
      setChildrenLimits(prev => ({...prev, [parentId]: newLimit}));
      const search = nodeSearch[parentId] ?? '';
      const sort = nodeSort[parentId] ?? DEFAULT_SORT;
      doFetch(parentId, newLimit, search, sort.metric, sort.direction);
    },
    [childrenLimits, nodeSearch, nodeSort, doFetch],
  );

  // Per-node search change handler
  const handleSearchChange = useCallback(
    (nodeId: string, query: string) => {
      setNodeSearch(prev => ({...prev, [nodeId]: query}));
      const limit = childrenLimits[nodeId] ?? INITIAL_CHILDREN_LIMIT;
      const sort = nodeSort[nodeId] ?? DEFAULT_SORT;
      doFetch(nodeId, limit, query, sort.metric, sort.direction);
    },
    [childrenLimits, nodeSort, doFetch],
  );

  // Per-node sort change handler
  const handleSortChange = useCallback(
    (
      nodeId: string,
      metric: TreeNodeOrderMetric,
      direction: OrderDirection,
    ) => {
      setNodeSort(prev => ({...prev, [nodeId]: {metric, direction}}));
      const limit = childrenLimits[nodeId] ?? INITIAL_CHILDREN_LIMIT;
      const search = nodeSearch[nodeId] ?? '';
      doFetch(nodeId, limit, search, metric, direction);
    },
    [childrenLimits, nodeSearch, doFetch],
  );

  // Build items array from cached data
  const items = useMemo<TreeViewBaseItem[]>(() => {
    const rootId = String(expressionId);

    function buildSubtree(id: string): TreeViewBaseItem {
      const cached = nodeData[id];
      if (cached?.node == null) {
        return {id, label: '...'};
      }

      if (!cached.fetched) {
        // Not yet fetched — make expandable with a placeholder
        return {
          id,
          label: cached.node.expressionType,
          children: [{id: `${id}${PLACEHOLDER_SUFFIX}`, label: 'Loading'}],
        };
      }

      const limit = childrenLimits[id] ?? INITIAL_CHILDREN_LIMIT;
      const visibleChildren = cached.children.slice(0, limit);

      const childItems: TreeViewBaseItem[] = visibleChildren.map(child =>
        buildSubtree(String(child.expressionId)),
      );

      // Combined controls row: "Show more" + sort selectors
      const hasMore = cached.children.length > limit;
      if (cached.children.length > 1 || hasMore) {
        const prefix = hasMore ? CONTROLS_MORE_PREFIX : CONTROLS_PREFIX;
        childItems.push({
          id: `${prefix}${id}`,
          label: 'Controls',
        });
      }

      return {
        id,
        label: cached.node.expressionType,
        children: childItems.length > 0 ? childItems : undefined,
      };
    }

    return [buildSubtree(rootId)];
  }, [expressionId, nodeData, childrenLimits]);

  // Context value
  const contextValue = useMemo<TreeDataContextValue>(
    () => ({
      nodeData,
      nodeMeta,
      expandedItems,
      onShowMore: handleShowMore,
      nodeSearch,
      onSearchChange: handleSearchChange,
      nodeSort,
      onSortChange: handleSortChange,
    }),
    [
      nodeData,
      nodeMeta,
      expandedItems,
      handleShowMore,
      nodeSearch,
      handleSearchChange,
      nodeSort,
      handleSortChange,
    ],
  );

  return (
    <>
      <Tooltip title="View Tree">
        <IconButton size="small" onClick={handleOpen}>
          <AccountTree sx={{fontSize: 18}} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        PaperProps={{sx: {width: '80vw', height: '80vh', maxHeight: '80vh'}}}>
        <DialogTitle>Tree Viewer</DialogTitle>
        <DialogContent sx={{overflow: 'auto'}}>
          {open && (
            <TreeDataContext.Provider value={contextValue}>
              <RichTreeView
                items={items}
                expandedItems={expandedItems}
                onExpandedItemsChange={handleExpandedItemsChange}
                slots={{item: CustomTreeItem}}
                sx={{
                  // Indent children and leave room for connector lines.
                  ['& .MuiTreeItem-groupTransition']: {
                    ml: '15px',
                    pl: '18px',
                  },
                  // Vertical line segment on each child <li>.
                  // Runs full height so consecutive siblings form a
                  // continuous vertical guide.
                  ['& .MuiCollapse-wrapperInner > .MuiTreeItem-root']: {
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '-18px',
                      borderLeft: '1.5px solid #d0d0d0',
                    },
                  },
                  // Last child: stop the vertical line at the horizontal
                  // connection point instead of running full height.
                  ['& .MuiCollapse-wrapperInner > .MuiTreeItem-root:last-of-type']:
                    {
                      '&::before': {
                        bottom: 'auto',
                        height: '13px',
                      },
                    },
                  // Horizontal stub connecting vertical line to content.
                  ['& .MuiCollapse-wrapperInner > .MuiTreeItem-root > .MuiTreeItem-content']:
                    {
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-18px',
                        top: '12px',
                        width: '16px',
                        height: 0,
                        borderBottom: '1.5px solid #d0d0d0',
                      },
                    },
                  // Hide connector lines on controls/show-more nodes.
                  ['& .MuiCollapse-wrapperInner > .tree-controls-node']: {
                    '&::before': {display: 'none'},
                  },
                  ['& .MuiCollapse-wrapperInner > .tree-controls-node > .MuiTreeItem-content']:
                    {
                      '&::before': {display: 'none'},
                    },
                  // Shorten vertical line on the last real node before controls.
                  ['& .MuiCollapse-wrapperInner > .MuiTreeItem-root:has(+ .tree-controls-node)']:
                    {
                      '&::before': {
                        bottom: 'auto',
                        height: '13px',
                      },
                    },
                }}
              />
            </TreeDataContext.Provider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
