'use client';

import {useCallback, useState} from 'react';

import {
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {Edit, MoreVertical, RotateCcw, Shuffle} from 'lucide-react';

import {useRebalancerHandle} from '@/lib/contexts/RebalancerHandleContext';
import {fetchMovesBetween} from '@/lib/rebalancer-explorer-api';
import {AssignmentBase} from '@/lib/rebalancer-explorer-types';

import type {UIAssignment} from './AssignmentCard';
import BulkMovesDialog from './BulkMovesDialog';

interface AssignmentSelectorMenuProps {
  assignment: UIAssignment;
  hasFinalAssignment: boolean;
  onAssignmentChange: (assignment: UIAssignment) => void;
}

export default function AssignmentSelectorMenu({
  assignment,
  hasFinalAssignment,
  onAssignmentChange,
}: AssignmentSelectorMenuProps) {
  const {handle} = useRebalancerHandle();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = anchorEl != null;

  const [bulkEditorOpen, setBulkEditorOpen] = useState(false);
  const [loadingFinalMoves, setLoadingFinalMoves] = useState(false);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClearAllMoves = useCallback(() => {
    onAssignmentChange({...assignment, overrides: []});
    handleClose();
  }, [assignment, onAssignmentChange, handleClose]);

  const handleShowFinalMoves = useCallback(async () => {
    if (handle == null) {
      return;
    }
    setLoadingFinalMoves(true);
    try {
      const response = await fetchMovesBetween(
        handle,
        {base: AssignmentBase.INITIAL, variableToContainerOverride: {}},
        {base: AssignmentBase.FINAL, variableToContainerOverride: {}},
      );
      const overrides = Object.entries(response.variableToContainer).map(
        ([variable, container]) => ({variable, container}),
      );
      onAssignmentChange({base: 'INITIAL', overrides, step: null});
    } catch {
      // Error is not surfaced here — the user can retry
    } finally {
      setLoadingFinalMoves(false);
      handleClose();
    }
  }, [handle, onAssignmentChange, handleClose]);

  const handleBulkEditor = useCallback(() => {
    setBulkEditorOpen(true);
    handleClose();
  }, [handleClose]);

  return (
    <>
      <Tooltip title="More actions">
        <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)}>
          <MoreVertical className="size-4" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
        <MenuItem
          disabled={assignment.overrides.length === 0}
          onClick={handleClearAllMoves}>
          <ListItemIcon>
            <RotateCcw className="size-4" />
          </ListItemIcon>
          <ListItemText
            primary="Clear all moves"
            secondary="Clears all the move modifiers listed below"
          />
        </MenuItem>

        <MenuItem
          disabled={!hasFinalAssignment || loadingFinalMoves}
          onClick={handleShowFinalMoves}>
          <ListItemIcon>
            {loadingFinalMoves ? (
              <CircularProgress size={16} />
            ) : (
              <Shuffle className="size-4" />
            )}
          </ListItemIcon>
          <ListItemText
            primary="Show final moves"
            secondary="Shows the final assignment as a series of moves applied on top of the initial assignment"
          />
        </MenuItem>

        <MenuItem onClick={handleBulkEditor}>
          <ListItemIcon>
            <Edit className="size-4" />
          </ListItemIcon>
          <ListItemText
            primary="Bulk moves editor"
            secondary="Opens a dialog for editing moves in bulk as text"
          />
        </MenuItem>
      </Menu>

      {bulkEditorOpen && (
        <BulkMovesDialog
          assignment={assignment}
          onAssignmentChange={onAssignmentChange}
          onClose={() => setBulkEditorOpen(false)}
        />
      )}
    </>
  );
}
