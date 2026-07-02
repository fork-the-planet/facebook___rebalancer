'use client';

import {Button, IconButton} from '@mui/material';
import {Plus, X} from 'lucide-react';
import type {
  ActionProps,
  ActionWithRulesAndAddersProps,
} from 'react-querybuilder';

export function AddFilterButton(props: ActionWithRulesAndAddersProps) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<Plus className="size-4" />}
      onClick={props.handleOnClick}
      disabled={props.disabled}
      sx={{textTransform: 'none'}}>
      Filter
    </Button>
  );
}

export function RemoveRuleButton(props: ActionProps) {
  return (
    <IconButton
      size="small"
      onClick={props.handleOnClick}
      disabled={props.disabled}
      title={typeof props.label === 'string' ? props.label : 'Remove filter'}>
      <X className="size-4" />
    </IconButton>
  );
}
