'use client';

import {useState} from 'react';

import Description from '@mui/icons-material/Description';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';

import SpecViewer from '@/app/components/evaluation/SpecViewer';
import type {Handle} from '@/lib/rebalancer-explorer-types';

interface SpecViewerButtonProps {
  name: string;
  expressionType: 'OBJECTIVE' | 'CONSTRAINT';
  handle: Handle;
}

export default function SpecViewerButton({
  name,
  expressionType,
  handle,
}: SpecViewerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="View Spec">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <Description sx={{fontSize: 18}} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{sx: {maxHeight: '80vh'}}}>
        <DialogTitle>
          {expressionType === 'CONSTRAINT' ? 'Constraint' : 'Goal'} Spec: {name}
        </DialogTitle>
        <DialogContent>
          {open && (
            <SpecViewer
              name={name}
              handle={handle}
              expressionType={expressionType}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
