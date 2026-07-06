'use client';

import ArrowRight from '@mui/icons-material/ArrowRight';
import {Typography} from '@mui/material';

import {precise} from '@/lib/format';
import {IMPROVING_COLOR, WORSENING_COLOR} from '@/lib/ui-tokens';

export function NodeDelta({
  sourceValue,
  destinationValue,
  minimizing,
}: {
  sourceValue: number;
  destinationValue: number;
  minimizing: boolean;
}) {
  const delta = destinationValue - sourceValue;
  if (delta === 0) {
    return null;
  }

  // When minimizing, decreasing values are good (green).
  // When maximizing, increasing values are good (green).
  const effectiveDelta = (minimizing ? 1 : -1) * delta;
  const color = effectiveDelta < 0 ? IMPROVING_COLOR : WORSENING_COLOR;

  return (
    <>
      <ArrowRight sx={{fontSize: 16, mx: 0.5, color: 'text.secondary'}} />
      <Typography
        component="span"
        variant="body2"
        sx={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem'}}>
        {precise(destinationValue)}
      </Typography>
      <Typography
        component="span"
        variant="body2"
        sx={{
          ml: 0.5,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.8125rem',
          color,
        }}>
        ({delta > 0 ? '+' : ''}
        {precise(delta)})
      </Typography>
    </>
  );
}
