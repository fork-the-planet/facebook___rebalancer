'use client';

import {alpha, createTheme, ThemeProvider} from '@mui/material/styles';

import {
  IMPROVING_COLOR,
  LINE_COLOR,
  MUTED_TEXT_COLOR,
  ROW_HOVER_COLOR,
  WORSENING_COLOR,
} from '@/lib/ui-tokens';

const theme = createTheme({
  typography: {fontFamily: 'var(--font-sans)'},
  palette: {
    text: {secondary: MUTED_TEXT_COLOR},
    divider: LINE_COLOR,
    action: {hover: ROW_HOVER_COLOR},
  },
  components: {
    // Change tags: a light tint of the shared IMPROVING/WORSENING colors, with
    // dark text for contrast.
    MuiChip: {
      variants: [
        {
          props: {variant: 'filled', color: 'success'},
          style: {
            backgroundColor: alpha(IMPROVING_COLOR, 0.2),
            color: '#09441F',
            '&:hover': {backgroundColor: alpha(IMPROVING_COLOR, 0.28)},
          },
        },
        {
          props: {variant: 'filled', color: 'error'},
          style: {
            backgroundColor: alpha(WORSENING_COLOR, 0.2),
            color: '#7B0210',
            '&:hover': {backgroundColor: alpha(WORSENING_COLOR, 0.28)},
          },
        },
      ],
    },
  },
});

export function MuiThemeProvider({children}: {children: React.ReactNode}) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
