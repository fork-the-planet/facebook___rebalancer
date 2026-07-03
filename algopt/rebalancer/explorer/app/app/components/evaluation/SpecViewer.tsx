'use client';

import {useCallback, useEffect, useState} from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  fetchConstraintSpec,
  fetchGoalSpec,
} from '@/lib/rebalancer-explorer-api';
import type {
  ConstraintSpec,
  GoalSpec,
  Handle,
} from '@/lib/rebalancer-explorer-types';

interface SpecField {
  label: string;
  value: string;
  tooltip?: string;
}

function isGoalSpec(spec: GoalSpec | ConstraintSpec): spec is GoalSpec {
  return 'weight' in spec;
}

function getSpecFields(spec: GoalSpec | ConstraintSpec): SpecField[] {
  if (isGoalSpec(spec)) {
    return [
      {label: 'Weight', value: String(spec.weight)},
      {label: 'Tuple Index', value: String(spec.tupleIndex)},
    ];
  }
  return [
    {
      label: 'Invalid Cost',
      value: String(spec.invalidCost),
      tooltip:
        'Weight applied to the goal representing the softened version of the constraint when initially broken',
    },
    {
      label: 'Invalid State',
      value: String(spec.invalidState),
      tooltip:
        'Fixed cost added to the goal when the softened constraint is broken',
    },
  ];
}

interface SpecViewerProps {
  name: string;
  handle: Handle;
  expressionType: 'OBJECTIVE' | 'CONSTRAINT';
}

export default function SpecViewer({
  name,
  handle,
  expressionType,
}: SpecViewerProps) {
  const [spec, setSpec] = useState<GoalSpec | ConstraintSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (expressionType === 'CONSTRAINT') {
        const response = await fetchConstraintSpec(handle, name);
        setSpec(response.spec);
      } else {
        // Objectives can be either true goals or soft constraints.
        // Soft constraints are classified as OBJECTIVE by the backend but
        // their names only exist in the constraint ID map. Try goal first,
        // then fall back to constraint.
        try {
          const response = await fetchGoalSpec(handle, name);
          setSpec(response.spec);
        } catch {
          const response = await fetchConstraintSpec(handle, name);
          setSpec(response.spec);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spec');
    } finally {
      setLoading(false);
    }
  }, [handle, name, expressionType]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  if (loading) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error != null) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (spec == null) {
    return <Alert severity="warning">No spec data available</Alert>;
  }

  let parsedSpec: unknown;
  try {
    parsedSpec = JSON.parse(spec.specJson);
  } catch {
    parsedSpec = spec.specJson;
  }

  const fields = getSpecFields(spec);

  return (
    <List dense>
      <ListItem>
        <ListItemText primary="Name" secondary={spec.name} />
      </ListItem>
      {fields.map(field =>
        field.tooltip != null ? (
          <ListItem key={field.label}>
            <Tooltip title={field.tooltip} placement="right">
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{cursor: 'help'}}>
                    {field.label}
                  </Typography>
                }
                secondary={field.value}
              />
            </Tooltip>
          </ListItem>
        ) : (
          <ListItem key={field.label}>
            <ListItemText primary={field.label} secondary={field.value} />
          </ListItem>
        ),
      )}
      <ListItem sx={{alignItems: 'flex-start'}}>
        <ListItemText
          primary="Spec"
          secondaryTypographyProps={{component: 'div'}}
          secondary={
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.8125rem',
                maxHeight: '60vh',
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
              }}>
              {typeof parsedSpec === 'string'
                ? parsedSpec
                : JSON.stringify(parsedSpec, null, 2)}
            </pre>
          }
        />
      </ListItem>
    </List>
  );
}
