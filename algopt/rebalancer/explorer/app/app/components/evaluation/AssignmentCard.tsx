'use client';

import {
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
} from '@mui/material';
import {ArrowLeftRight} from 'lucide-react';

import {useProblemMetadata} from '@/lib/contexts/ProblemMetadataContext';

import AssignmentSelectorMenu from './AssignmentSelectorMenu';
import LocalSearchNavigator from './LocalSearchNavigator';
import MoveList from './MoveList';

/**
 * UI-level assignment type, mirroring the www RebalancerExplorerAssignment.
 * Converted to the thrift Assignment type when making API calls.
 */
export interface UIAssignment {
  base: 'INITIAL' | 'FINAL' | 'INTERMEDIATE';
  overrides: Array<{variable: string; container: string}>;
  step: number | null;
}

export interface Assignments {
  src: UIAssignment;
  dst: UIAssignment;
}

interface AssignmentSelectorProps {
  header: string;
  helpMessage: string;
  assignment: UIAssignment;
  onChange: (assignment: UIAssignment) => void;
  hasFinalAssignment: boolean;
  hasIntermediateAssignment: boolean;
  numSteps: number;
  showMenu: boolean;
}

function AssignmentSelector({
  header,
  helpMessage,
  assignment,
  onChange,
  hasFinalAssignment,
  hasIntermediateAssignment,
  numSteps,
  showMenu,
}: AssignmentSelectorProps) {
  const handleBaseChange = (newBase: UIAssignment['base']) => {
    const newAssignment: UIAssignment = {...assignment, base: newBase};

    if (newBase === 'INTERMEDIATE' && assignment.step == null) {
      if (assignment.base === 'INITIAL') {
        newAssignment.step = 0;
      }
      if (assignment.base === 'FINAL') {
        newAssignment.step = numSteps;
      }
    }

    if (newBase === 'INITIAL' || newBase === 'FINAL') {
      newAssignment.step = null;
    }

    onChange(newAssignment);
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={header}
        titleTypographyProps={{variant: 'subtitle2'}}
        subheader={helpMessage}
        subheaderTypographyProps={{variant: 'caption'}}
        sx={{pb: 0}}
        action={
          showMenu ? (
            <AssignmentSelectorMenu
              assignment={assignment}
              hasFinalAssignment={hasFinalAssignment}
              onAssignmentChange={onChange}
            />
          ) : undefined
        }
      />
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-1">
            Base
          </div>
          <RadioGroup
            value={assignment.base}
            onChange={e =>
              handleBaseChange(e.target.value as UIAssignment['base'])
            }
            row>
            <FormControlLabel
              value="INITIAL"
              control={<Radio size="small" />}
              label="Initial"
              slotProps={{typography: {variant: 'body2'}}}
            />
            <Tooltip
              title={
                hasFinalAssignment
                  ? 'Assignment solution proposed by Rebalancer'
                  : 'No final assignment available'
              }>
              <FormControlLabel
                value="FINAL"
                control={<Radio size="small" />}
                label="Final"
                disabled={!hasFinalAssignment}
                slotProps={{typography: {variant: 'body2'}}}
              />
            </Tooltip>
            <Tooltip
              title={
                hasIntermediateAssignment
                  ? 'Intermediate assignment after applying the first k moveSets'
                  : 'No intermediate assignments available'
              }>
              <FormControlLabel
                value="INTERMEDIATE"
                control={<Radio size="small" />}
                label="Intermediate"
                disabled={!hasIntermediateAssignment}
                slotProps={{typography: {variant: 'body2'}}}
              />
            </Tooltip>
          </RadioGroup>
          {hasIntermediateAssignment && assignment.base === 'INTERMEDIATE' && (
            <TextField
              label="MoveSet #"
              type="number"
              size="small"
              value={assignment.step ?? 0}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onChange({
                    ...assignment,
                    step: Math.max(0, Math.min(numSteps, val)),
                  });
                }
              }}
              slotProps={{
                htmlInput: {min: 0, max: numSteps, step: 1},
              }}
              sx={{mt: 1, width: 120}}
            />
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-1">
            + {assignment.overrides.length} moves
          </div>
          <MoveList
            moves={assignment.overrides}
            onChange={newOverrides =>
              onChange({...assignment, overrides: newOverrides})
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface AssignmentCardProps {
  assignments: Assignments;
  onAssignmentsChange: (assignments: Assignments) => void;
}

export default function AssignmentCard({
  assignments,
  onAssignmentsChange,
}: AssignmentCardProps) {
  const {metadata} = useProblemMetadata();

  const hasFinalAssignment = metadata?.hasFinalAssignment ?? false;
  const hasIntermediateAssignment =
    metadata?.hasIntermediateAssignment ?? false;
  const numSteps = metadata?.numSteps ?? 0;

  return (
    <Card>
      <CardHeader
        title="Assignments to compare"
        titleTypographyProps={{variant: 'h6'}}
      />
      <CardContent>
        {hasIntermediateAssignment && (
          <LocalSearchNavigator
            assignments={assignments}
            onAssignmentsChange={onAssignmentsChange}
            numSteps={numSteps}
          />
        )}
        <div className="grid grid-cols-[1fr_max-content_1fr] gap-2 items-start">
          <AssignmentSelector
            header="Assignment A"
            helpMessage="The first of two assignments to compare"
            assignment={assignments.src}
            onChange={src => onAssignmentsChange({...assignments, src})}
            hasFinalAssignment={hasFinalAssignment}
            hasIntermediateAssignment={hasIntermediateAssignment}
            numSteps={numSteps}
            showMenu
          />
          <div className="self-center">
            <Tooltip title="Exchange assignments">
              <IconButton
                size="small"
                onClick={() =>
                  onAssignmentsChange({
                    src: assignments.dst,
                    dst: assignments.src,
                  })
                }>
                <ArrowLeftRight className="size-4" />
              </IconButton>
            </Tooltip>
          </div>
          <AssignmentSelector
            header="Assignment B"
            helpMessage="The second of two assignments to compare"
            assignment={assignments.dst}
            onChange={dst => onAssignmentsChange({...assignments, dst})}
            hasFinalAssignment={hasFinalAssignment}
            hasIntermediateAssignment={hasIntermediateAssignment}
            numSteps={numSteps}
            showMenu
          />
        </div>
      </CardContent>
    </Card>
  );
}
