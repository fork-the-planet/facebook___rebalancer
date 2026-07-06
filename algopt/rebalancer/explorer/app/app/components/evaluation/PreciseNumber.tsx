'use client';

import {useCallback, useState} from 'react';

import {Box, Chip, Tooltip} from '@mui/material';

import {getBadgeColor, precise} from '@/lib/format';

function formatNumber(value: number, fixedDecimals?: number): string {
  if (fixedDecimals != null) {
    return value.toFixed(fixedDecimals);
  }
  return precise(value);
}

export default function PreciseNumber({
  value,
  highlight,
  positiveIsBad = true,
  fixedDecimals,
}: {
  value: number;
  highlight: boolean;
  positiveIsBad?: boolean;
  fixedDecimals?: number;
}) {
  const [showRaw, setShowRaw] = useState(false);

  const displayText = showRaw
    ? String(value)
    : formatNumber(value, fixedDecimals);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRaw(prev => !prev);
  }, []);

  if (highlight) {
    const badgeColor = getBadgeColor(value, positiveIsBad);
    return (
      <Tooltip title={showRaw ? 'Click for formatted' : 'Click for raw'}>
        <Chip
          label={displayText}
          size="small"
          color={badgeColor}
          variant={badgeColor === 'default' ? 'outlined' : 'filled'}
          onClick={toggle}
          sx={{
            cursor: 'pointer',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.8125rem',
            // Let the chip grow and the number wrap, instead of clipping it with "...".
            height: 'auto',
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              overflow: 'visible',
              textOverflow: 'clip',
              py: '2px',
            },
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={showRaw ? 'Click for formatted' : 'Click for raw'}>
      <Box
        component="span"
        onClick={toggle}
        sx={{
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.8125rem',
          '&:hover': {textDecoration: 'underline'},
        }}>
        {displayText}
      </Box>
    </Tooltip>
  );
}
