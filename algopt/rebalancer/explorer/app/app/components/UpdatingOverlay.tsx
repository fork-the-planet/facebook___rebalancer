'use client';

import {Box, CircularProgress} from '@mui/material';
import {alpha, lighten} from '@mui/material/styles';

// Shown over a table while it reloads after a columns/filter/grouping/page
// change. The old rows stay dimmed underneath, so it reads as "updating", not
// frozen.
export default function UpdatingOverlay() {
  return (
    <Box
      role="status"
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: 4,
        bgcolor: theme => alpha(theme.palette.background.paper, 0.7),
        zIndex: 10,
        // Dim, but let clicks through so controls stay usable during a refetch.
        pointerEvents: 'none',
      }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
          bgcolor: theme => lighten(theme.palette.primary.main, 0.88),
          color: 'primary.dark',
          border: 1,
          borderColor: 'primary.main',
          borderRadius: 2,
          boxShadow: 3,
          fontWeight: 600,
        }}>
        <CircularProgress size={20} aria-hidden />
        Updating data...
      </Box>
    </Box>
  );
}
