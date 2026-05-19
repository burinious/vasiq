import { createTheme } from '@mui/material/styles';

export const premiumPalette = {
  ink: '#0f172a',
  muted: '#64748b',
  primary: '#0f766e',
  secondary: '#10b981',
  danger: '#dc2626',
  success: '#059669',
};

export const pageBgSx = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(15,118,110,0.18), transparent 32%), radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 30%), linear-gradient(135deg, #ecfdf5 0%, #f8fafc 45%, #f0fdfa 100%)',
};

export const glassCardSx = {
  border: '1px solid rgba(255,255,255,0.42)',
  background: 'linear-gradient(145deg, rgba(255,255,255,0.84), rgba(255,255,255,0.56))',
  backdropFilter: 'blur(22px)',
  boxShadow: '0 24px 80px rgba(15,23,42,0.12)',
  borderRadius: 5,
};

export const darkGlassCardSx = {
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'linear-gradient(145deg, rgba(15,23,42,0.94), rgba(30,41,59,0.84))',
  backdropFilter: 'blur(22px)',
  boxShadow: '0 24px 80px rgba(15,23,42,0.24)',
  borderRadius: 5,
  color: '#fff',
};

export const heroGlassSx = {
  border: '1px solid rgba(255,255,255,0.32)',
  background:
    'radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 30%), linear-gradient(135deg, rgba(15,118,110,0.94), rgba(20,184,166,0.86), rgba(20,184,166,0.76))',
  color: '#fff',
  backdropFilter: 'blur(24px)',
  boxShadow: '0 28px 90px rgba(15,118,110,0.26)',
  borderRadius: 6,
  overflow: 'hidden',
  position: 'relative',
};

export const softInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(14px)',
    '& fieldset': {
      borderColor: 'rgba(148,163,184,0.34)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(16,185,129,0.55)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(16,185,129,0.9)',
      borderWidth: 1.5,
    },
  },
};

export const primaryButtonSx = {
  borderRadius: 999,
  px: 3,
  py: 1.1,
  textTransform: 'none',
  fontWeight: 900,
  background: 'linear-gradient(135deg, #0f766e, #10b981)',
  boxShadow: '0 16px 32px rgba(15,118,110,0.28)',
  '&:hover': {
    background: 'linear-gradient(135deg, #0d9488, #047857)',
    boxShadow: '0 18px 38px rgba(15,118,110,0.36)',
  },
};

export const dangerButtonSx = {
  borderRadius: 999,
  px: 2.4,
  py: 1,
  textTransform: 'none',
  fontWeight: 900,
  color: '#fff',
  background: 'linear-gradient(135deg, #dc2626, #f97316)',
  boxShadow: '0 16px 32px rgba(220,38,38,0.22)',
  '&:hover': {
    background: 'linear-gradient(135deg, #b91c1c, #ea580c)',
  },
};

export const sectionTitleSx = {
  eyebrow: {
    color: 'primary.main',
    fontWeight: 950,
    letterSpacing: 1.25,
  },
  title: {
    color: premiumPalette.ink,
    fontWeight: 950,
    letterSpacing: 0,
  },
  body: {
    color: premiumPalette.muted,
    lineHeight: 1.65,
  },
};

export const chipSx = {
  borderRadius: 999,
  fontWeight: 900,
};

export const premiumMuiTheme = createTheme({
  palette: {
    primary: {
      main: premiumPalette.primary,
    },
    secondary: {
      main: premiumPalette.secondary,
    },
    error: {
      main: premiumPalette.danger,
    },
    success: {
      main: premiumPalette.success,
    },
    text: {
      primary: premiumPalette.ink,
      secondary: premiumPalette.muted,
    },
    background: {
      default: '#f8fafc',
      paper: 'rgba(255,255,255,0.84)',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 900,
    },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          letterSpacing: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800,
        },
      },
    },
  },
});
