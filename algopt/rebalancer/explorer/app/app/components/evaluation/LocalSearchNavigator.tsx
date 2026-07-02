'use client';

import {Button, IconButton, Tooltip, Typography} from '@mui/material';
import {
  ChevronFirst,
  ChevronLast,
  LogOut,
  Navigation,
  RotateCcw,
} from 'lucide-react';

import type {Assignments} from './AssignmentCard';

export interface LocalSearchNavigatorProps {
  assignments: Assignments;
  onAssignmentsChange: (a: Assignments) => void;
  numSteps: number;
}

export default function LocalSearchNavigator({
  assignments,
  onAssignmentsChange,
  numSteps,
}: LocalSearchNavigatorProps) {
  const isNavigating =
    assignments.src.base === 'INTERMEDIATE' &&
    assignments.dst.base === 'INTERMEDIATE' &&
    assignments.src.step != null &&
    assignments.dst.step != null;

  const startNavigation = () => {
    onAssignmentsChange({
      src: {base: 'INTERMEDIATE', overrides: [], step: 0},
      dst: {base: 'INTERMEDIATE', overrides: [], step: 1},
    });
  };

  const exitNavigation = () => {
    onAssignmentsChange({
      src: {base: 'INITIAL', overrides: [], step: null},
      dst: {base: 'FINAL', overrides: [], step: null},
    });
  };

  const onStepNavigation = (forward: boolean) => {
    const increment = forward ? 1 : -1;
    const srcStep = Math.min(
      numSteps - 1,
      Math.max(0, (assignments.src.step ?? 0) + increment),
    );
    const dstStep = Math.min(
      numSteps,
      Math.max(1, (assignments.dst.step ?? 0) + increment),
    );
    onAssignmentsChange({
      src: {base: 'INTERMEDIATE', overrides: [], step: srcStep},
      dst: {base: 'INTERMEDIATE', overrides: [], step: dstStep},
    });
  };

  if (!isNavigating) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <Button
          size="small"
          variant="outlined"
          startIcon={<Navigation className="size-4" />}
          onClick={startNavigation}>
          Start Navigation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mb-2">
      <Tooltip title="Restart navigation">
        <IconButton size="small" onClick={startNavigation}>
          <RotateCcw className="size-4" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Exit navigation">
        <IconButton size="small" onClick={exitNavigation}>
          <LogOut className="size-4" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Previous step">
        <span>
          <IconButton
            size="small"
            onClick={() => onStepNavigation(false)}
            disabled={assignments.src.step === 0}>
            <ChevronFirst className="size-4" />
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="body2" sx={{mx: 1}}>
        Step {assignments.src.step} vs Step {assignments.dst.step}
      </Typography>
      <Tooltip title="Next step">
        <span>
          <IconButton
            size="small"
            onClick={() => onStepNavigation(true)}
            disabled={assignments.dst.step === numSteps}>
            <ChevronLast className="size-4" />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
}
