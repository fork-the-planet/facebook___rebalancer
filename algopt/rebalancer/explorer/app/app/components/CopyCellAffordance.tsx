'use client';

import {Copy} from 'lucide-react';

/**
 * A hover- or focus-revealed copy icon that marks a cell as click-to-copy. The cell
 * itself does the copying (its `<td>` has useCopyOnClick's `copyOnClick`); this
 * icon is purely the visual hint so the feature is discoverable instead of
 * hidden. It uses `pointer-events-none` so clicks pass through to the cell, and
 * `data-copy-skip` so it is never part of the copied text.
 *
 * Sits at the right edge of the cell (consistent across all tables). The cell
 * must set `className="group"` and `position: relative`, and keep enough right
 * padding that the icon doesn't overlap a right-aligned value.
 */
export default function CopyCellAffordance() {
  return (
    <Copy
      data-copy-skip
      aria-hidden
      className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 group-focus-within:opacity-60"
    />
  );
}
