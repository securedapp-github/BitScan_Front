import { AppBar, Toolbar, Box, Button, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

type SecureTraceNavProps = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onShowHowWeWork: () => void;
  onShowFAQ: () => void;
  onShowHistory: () => void;
};

export const SecureTraceNav: React.FC<SecureTraceNavProps> = ({
  isDarkMode,
  onToggleTheme,
  onShowHowWeWork,
  onShowFAQ,
  onShowHistory,
}) => (
  <NavBar position="static" elevation={0}>
    <Toolbar
      disableGutters
      sx={{
        width: '100%',
        px: { xs: 2, md: 3 },
        py: { xs: 0.7, md: 1 },
        justifyContent: 'center',
      }}
    >
      <HeaderRow>
        <LogoBox src="/logo copy.png" alt="BitScan logo" />

        <Shell>
          <NavButton onClick={onShowHowWeWork}>How we work</NavButton>
          <NavButton onClick={onShowFAQ}>FAQ</NavButton>
          <NavButton onClick={onShowHistory}>Scan history</NavButton>
        </Shell>

        <ToggleButton onClick={onToggleTheme} aria-label="Toggle theme">
          {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </ToggleButton>
      </HeaderRow>
    </Toolbar>
  </NavBar>
);

export const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.mode === 'dark' ? '#0d1629' : '#f8fafc',
  backgroundImage: theme.palette.mode === 'dark'
    ? 'linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px)'
    : 'linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
  backgroundPosition: '0 0',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? 'radial-gradient(ellipse at top left, rgba(79, 141, 245, 0.2) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(14, 116, 144, 0.18) 0%, transparent 65%)'
      : 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0
  },
  '& > *': {
    position: 'relative',
    zIndex: 1
  }
}));

const NavBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  boxShadow: 'none',
  border: 'none',
  position: 'relative',
  zIndex: theme.zIndex.appBar,
  '& .MuiToolbar-root': {
    backgroundColor: 'transparent'
  }
}));

const HeaderRow = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: theme.breakpoints.values.lg,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: theme.spacing(2),
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(1.5),
  },
}));

const LogoBox = styled('img')(({ theme }) => ({
  width: 50,
  height: 'auto',
  display: 'block',
  objectFit: 'contain',
  filter: 'drop-shadow(0 6px 16px rgba(59, 130, 246, 0.28))',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  [theme.breakpoints.up('sm')]: {
    width: 60,
  },
  [theme.breakpoints.up('md')]: {
    width: 72,
  },
  [theme.breakpoints.up('lg')]: {
    width: 86,
  },
}));

const Shell = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: 'fit-content',
  padding: theme.spacing(0.75, 1.5),
  borderRadius: 9999,
  background: theme.palette.mode === 'dark' 
    ? 'rgba(51, 65, 85, 0.6)' 
    : 'rgba(255, 255, 255, 0.95)',
  justifySelf: 'center',
  border: theme.palette.mode === 'dark'
    ? '1.5px solid rgba(148, 163, 184, 0.3)'
    : '1.5px solid rgba(226, 232, 240, 0.8)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 20px rgba(15, 23, 42, 0.2)'
    : '0 8px 20px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(12px)',
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(3),
    padding: theme.spacing(1, 2.5),
  },
}));

const NavButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(0.3, 0.5),
  minWidth: 'auto',
  borderRadius: 0,
  fontWeight: 500,
  letterSpacing: '0.01em',
  textTransform: 'none',
  fontSize: '0.7rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
  '&:hover': {
    background: 'transparent',
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: '0.8rem',
    padding: theme.spacing(0.35, 0.75),
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '0.9rem',
    padding: theme.spacing(0.4, 0),
  },
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
  background: 'transparent',
  borderRadius: 8,
  padding: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(0.65),
  },
}));