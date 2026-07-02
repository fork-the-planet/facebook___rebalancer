'use client';

import {useState} from 'react';

import {Box, Typography} from '@mui/material';

const WRAP_STYLES = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
} as const;

export default function CollapsibleText({
  text,
  clampLines,
}: {
  text: string;
  /**
   * When set, the collapsed state wraps text and clamps to this many lines
   * instead of truncating to a single line. Use in unconstrained containers
   * (e.g. the tree viewer) where wrapping is preferred over horizontal scroll.
   */
  clampLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;

  if (!isLong) {
    return (
      <Typography variant="body2" sx={{fontSize: '0.8125rem', ...WRAP_STYLES}}>
        {text}
      </Typography>
    );
  }

  const collapsedSx =
    clampLines != null
      ? ({
          display: '-webkit-box',
          WebkitLineClamp: clampLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as const)
      : ({
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 300,
        } as const);

  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.8125rem',
          ...WRAP_STYLES,
          ...(expanded ? {} : collapsedSx),
        }}>
        {text}
      </Typography>
      <Box
        component="span"
        data-copy-skip
        onClick={e => {
          e.stopPropagation();
          setExpanded(prev => !prev);
        }}
        sx={{
          cursor: 'pointer',
          color: 'primary.main',
          fontSize: '0.75rem',
          '&:hover': {textDecoration: 'underline'},
        }}>
        {expanded ? 'Show less' : 'Show more'}
      </Box>
    </Box>
  );
}
