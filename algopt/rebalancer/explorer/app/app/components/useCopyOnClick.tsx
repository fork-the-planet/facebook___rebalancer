'use client';

import {Snackbar} from '@mui/material';
import {useCallback, useState} from 'react';

/**
 * Click-to-copy for table cells. Returns:
 * - `copyOnClick`: an onClick handler that copies the rendered text of the
 *   clicked element to the clipboard. Skips empty values and the `-`
 *   placeholder.
 * - `copyOnKeyDown`: a keyboard handler that triggers the same copy on
 *   Enter or Space. Pair with `tabIndex={0}` and `role="button"` on the
 *   copyable element to make the action keyboard-accessible.
 * - `snackbar`: a "Copied to clipboard" Snackbar element to render once per
 *   table. Only shown when the clipboard write succeeds.
 *
 * Inner interactive elements (buttons, toggles) should:
 * - call `event.stopPropagation()` to prevent unintended copies when
 *   clicked, AND
 * - set the `data-copy-skip` attribute so their text content is excluded
 *   from the copied string when the user clicks elsewhere in the cell.
 */
function getCopyableText(root: Element): string {
  // Walk the subtree collecting text from nodes that are NOT inside an
  // element marked with `data-copy-skip`. This excludes UI controls like
  // "Show more" / "Show less" toggles from the copied value.
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as Element).hasAttribute('data-copy-skip')
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_SKIP;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
  let node = walker.nextNode();
  while (node != null) {
    text += node.nodeValue ?? '';
    node = walker.nextNode();
  }
  return text;
}

// Keep the confirmation readable when a cell holds a long value.
function truncateForMessage(text: string): string {
  const MAX = 60;
  return text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text;
}

export default function useCopyOnClick(): {
  copyOnClick: (event: React.MouseEvent<HTMLElement>) => void;
  copyOnKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  snackbar: React.ReactElement;
} {
  const [open, setOpen] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  const copyFromTarget = useCallback((target: HTMLElement) => {
    const text = getCopyableText(target).trim();
    if (text === '' || text === '-') {
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedText(text);
        setOpen(true);
      },
      () => {
        // Clipboard write failed (permission denied, document not focused,
        // etc.) — leave the snackbar closed.
      },
    );
  }, []);

  const copyOnClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      copyFromTarget(event.currentTarget);
    },
    [copyFromTarget],
  );

  const copyOnKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        copyFromTarget(event.currentTarget);
      }
    },
    [copyFromTarget],
  );

  const snackbar = (
    <Snackbar
      open={open}
      autoHideDuration={1500}
      onClose={() => setOpen(false)}
      message={`Copied "${truncateForMessage(copiedText)}" to clipboard`}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
    />
  );

  return {copyOnClick, copyOnKeyDown, snackbar};
}
