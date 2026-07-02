'use client';

import {useRef, useState} from 'react';

import Search from '@mui/icons-material/Search';
import {InputAdornment, TextField} from '@mui/material';

export function NodeSearchInput({
  itemId,
  nodeSearch,
  onSearchChange,
}: {
  itemId: string;
  nodeSearch: Record<string, string>;
  onSearchChange: (nodeId: string, query: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState(nodeSearch[itemId] ?? '');
  // Refs let the debounced callback see the latest parent values without
  // restarting the timer on every render.
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;
  const nodeSearchRef = useRef(nodeSearch);
  nodeSearchRef.current = nodeSearch;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (value !== (nodeSearchRef.current[itemId] ?? '')) {
        onSearchChangeRef.current(itemId, value);
      }
    }, 500);
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={e => e.stopPropagation()}>
      <TextField
        size="small"
        placeholder="Search children..."
        value={localSearch}
        onChange={e => handleChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{fontSize: 16}} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          ml: 1,
          width: 220,
          '& .MuiInputBase-input': {fontSize: '0.75rem', py: 0.5},
        }}
      />
    </div>
  );
}
