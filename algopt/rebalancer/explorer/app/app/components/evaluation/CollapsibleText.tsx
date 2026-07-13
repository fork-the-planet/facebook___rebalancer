'use client';

import {useEffect, useRef, useState} from 'react';

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
  const [clipped, setClipped] = useState(false);
  const textRef = useRef<HTMLElement | null>(null);

  // Show the toggle only when the collapsed text is actually clipped.
  useEffect(() => {
    const el = textRef.current;
    if (el == null) {
      return;
    }
    const measure = () => {
      setClipped(
        clampLines != null
          ? el.scrollHeight > el.clientHeight
          : el.scrollWidth > el.clientWidth,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, clampLines, expanded]);

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
        } as const);

  return (
    <Box>
      <Typography
        ref={node => {
          textRef.current = node;
        }}
        variant="body2"
        sx={{
          fontSize: '0.8125rem',
          ...WRAP_STYLES,
          ...(expanded ? {} : collapsedSx),
        }}>
        {text}
      </Typography>
      {(clipped || expanded) && (
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
      )}
    </Box>
  );
}
