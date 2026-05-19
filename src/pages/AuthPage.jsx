import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import Loader from '../components/layout/Loader';
import { useAuth } from '../context/AuthContext';
import {
  NIGERIAN_LEVELS,
  NIGERIAN_PROGRAMMES,
  NIGERIAN_UNIVERSITIES,
} from '../data/nigeriaAcademics';
import {
  getReadableAuthError,
  loginWithEmail,
  registerWithEmail,
} from '../firebase/auth';
import { glassCardSx, pageBgSx, primaryButtonSx, softInputSx } from '../styles/premiumTheme';

const initialRegisterState = {
  email: '',
  password: '',
  university: '',
  department: '',
  level: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const universityOptions = NIGERIAN_UNIVERSITIES.map((university) => university.name);
const courseOptions = NIGERIAN_PROGRAMMES;

const authFieldSx = {
  ...softInputSx,
  '& .MuiOutlinedInput-root': {
    ...softInputSx['& .MuiOutlinedInput-root'],
    minHeight: 56,
    borderRadius: 4,
    background:
      'linear-gradient(145deg, rgba(255,255,255,0.94), rgba(248,250,252,0.82))',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72), 0 10px 24px rgba(15,23,42,0.05)',
  },
  '& .MuiInputAdornment-root svg': {
    color: '#0f766e',
  },
};

const authSubmitButtonSx = {
  ...primaryButtonSx,
  minHeight: 54,
  justifyContent: 'space-between',
  px: 2.2,
  boxShadow: '0 18px 38px rgba(15,118,110,0.32)',
};

function getEmailValidationError(email) {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return 'Email is required.';
  }

  if (!emailPattern.test(trimmedEmail)) {
    return 'Enter a valid email address.';
  }

  return '';
}

function getPasswordValidationError(password, { strict = false } = {}) {
  if (!password) {
    return 'Password is required.';
  }

  if (!strict) {
    return '';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }

  return '';
}

function AuthPage() {
  const location = useLocation();
  const { currentUser, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginValues, setLoginValues] = useState({ email: '', password: '' });
  const [registerValues, setRegisterValues] = useState(initialRegisterState);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/feed';

  if (loading) {
    return <Loader />;
  }

  if (currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    const emailError = getEmailValidationError(loginValues.email);
    const passwordError = getPasswordValidationError(loginValues.password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      setStatus('');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('');

    try {
      await loginWithEmail(loginValues);
    } catch (loginError) {
      setError(getReadableAuthError(loginError));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const emailError = getEmailValidationError(registerValues.email);
    const passwordError = getPasswordValidationError(registerValues.password, {
      strict: true,
    });
    const selectedUniversity = registerValues.university.trim();
    const schoolError = !selectedUniversity
      ? 'Select your university.'
      : !universityOptions.includes(selectedUniversity)
        ? 'Choose your university from the list.'
      : !registerValues.department
        ? 'Select your course of discipline.'
      : !courseOptions.includes(registerValues.department)
        ? 'Choose your course of discipline from the list.'
        : !registerValues.level
          ? 'Select your level.'
          : '';

    if (emailError || passwordError || schoolError) {
      setError(emailError || passwordError || schoolError);
      setStatus('');
      return;
    }

    if (!acceptedLegal) {
      setError('You must accept the Terms and Privacy Policy before creating an account.');
      setStatus('');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('');

    try {
      await registerWithEmail(registerValues);
      setStatus(
        `Verification email sent to ${registerValues.email}. Check your inbox or spam folder before logging in.`,
      );
    } catch (registerError) {
      setError(getReadableAuthError(registerError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="mobile-auth-page" sx={{ ...pageBgSx, minHeight: '100vh', display: 'grid', alignItems: 'center', py: { xs: 3, md: 6 } }}>
      <Container className="mobile-auth-container" maxWidth="lg">
        <Card className="mobile-auth-shell" sx={{ ...glassCardSx, overflow: 'hidden' }}>
          <Box className="mobile-auth-grid" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' } }}>
            <Box
              className="mobile-auth-hero"
              sx={{
                p: { xs: 3, md: 5 },
                color: '#fff',
                background:
                  'radial-gradient(circle at top left, rgba(255,255,255,0.32), transparent 28%), linear-gradient(135deg, #0f766e, #10b981 56%, #14b8a6)',
                minHeight: { md: 640 },
                display: 'grid',
                alignContent: 'space-between',
                gap: 4,
              }}
            >
              <Stack className="mobile-auth-hero-copy" spacing={2}>
                <Chip label="VASIQ" sx={{ width: 'fit-content', color: '#fff', bgcolor: 'rgba(255,255,255,0.16)', fontWeight: 950, letterSpacing: 1.2 }} />
                <Typography variant="h2" sx={{ fontWeight: 950, lineHeight: 1.02, fontSize: { xs: '2.35rem', md: '4rem' } }}>
                  The live campus pulse for student momentum.
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.86)', maxWidth: 620, fontSize: '1.02rem', lineHeight: 1.75 }}>
                  Catch urgent class changes, hostel gist, events, opportunities, and the conversations students actually open every day.
                </Typography>
                <Stack className="mobile-auth-badges" direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {['Urgent updates', 'Useful groups', 'Student life'].map((item) => (
                    <Chip key={item} label={item} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.16)', fontWeight: 900 }} />
                  ))}
                </Stack>
              </Stack>
              <Paper className="mobile-auth-note" elevation={0} sx={{ p: 2.4, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(16px)' }}>
                <Typography variant="overline" sx={{ fontWeight: 950, letterSpacing: 1.4 }}>Inside VASIQ</Typography>
                <Typography variant="h5" sx={{ fontWeight: 950, mt: 0.5 }}>One place for updates students keep chasing in scattered chats.</Typography>
              </Paper>
            </Box>

            <CardContent className="mobile-auth-form-panel" sx={{ p: { xs: 2.5, md: 4 }, display: 'grid', alignContent: 'center' }}>
              <Stack className="mobile-auth-form-stack" spacing={2.4}>
                <Box className="mobile-auth-heading">
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 950, letterSpacing: 1.2 }}>Access</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a' }}>Enter the campus pulse</Typography>
                  <Typography sx={{ color: '#64748b', mt: 0.8 }}>
                    Use your email to sign in or create an account, then verify it before joining the live student network.
                  </Typography>
                </Box>

                <Stack className="mobile-auth-tabs" direction="row" spacing={1}>
                  <Button
                    type="button"
                    variant={mode === 'login' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setStatus('');
                    }}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  >
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'register' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setMode('register');
                      setError('');
                      setStatus('');
                    }}
                    sx={{ borderRadius: 999, fontWeight: 900 }}
                  >
                    Create account
                  </Button>
                </Stack>

                {mode === 'login' ? (
                  <Stack className="mobile-auth-form mobile-auth-login-form" component="form" onSubmit={handleLogin} spacing={1.6}>
                    <Paper
                      elevation={0}
                      className="mobile-auth-login-strip"
                      sx={{
                        p: 1.45,
                        borderRadius: 3.5,
                        border: '1px solid rgba(16,185,129,0.16)',
                        background:
                          'linear-gradient(135deg, rgba(15,118,110,0.10), rgba(14,165,233,0.08), rgba(255,255,255,0.86))',
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box className="mobile-auth-login-strip-icon">
                          <VerifiedUserRoundedIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography className="mobile-auth-login-strip-title" sx={{ fontWeight: 950, color: '#0f172a' }}>
                            Welcome back
                          </Typography>
                          <Typography className="mobile-auth-login-strip-copy" variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
                            Continue to your feed, chats, and groups.
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                    <TextField
                      type="email"
                      label="Email"
                      autoComplete="email"
                      value={loginValues.email}
                      onChange={(event) => setLoginValues((current) => ({ ...current, email: event.target.value }))}
                      required
                      sx={authFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AlternateEmailRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      type={showLoginPassword ? 'text' : 'password'}
                      label="Password"
                      autoComplete="current-password"
                      value={loginValues.password}
                      onChange={(event) => setLoginValues((current) => ({ ...current, password: event.target.value }))}
                      required
                      sx={authFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              className="auth-password-toggle"
                              type="button"
                              onClick={() => setShowLoginPassword((current) => !current)}
                              aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                              sx={{ minWidth: 66, borderRadius: 999, fontWeight: 950 }}
                            >
                              {showLoginPassword ? 'Hide' : 'Show'}
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}
                    {status ? <Alert severity="info" sx={{ borderRadius: 3 }}>{status}</Alert> : null}
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={busy}
                      endIcon={<ArrowForwardRoundedIcon />}
                      sx={authSubmitButtonSx}
                    >
                      {busy ? 'Signing in...' : 'Login'}
                    </Button>
                  </Stack>
                ) : (
                  <Stack className="mobile-auth-form" component="form" onSubmit={handleRegister} spacing={1.6}>
                    <TextField
                      type="email"
                      label="Email"
                      autoComplete="email"
                      value={registerValues.email}
                      onChange={(event) => setRegisterValues((current) => ({ ...current, email: event.target.value }))}
                      required
                      sx={authFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AlternateEmailRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      type={showRegisterPassword ? 'text' : 'password'}
                      label="Password"
                      autoComplete="new-password"
                      value={registerValues.password}
                      onChange={(event) => setRegisterValues((current) => ({ ...current, password: event.target.value }))}
                      inputProps={{ minLength: 8 }}
                      required
                      sx={authFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              className="auth-password-toggle"
                              type="button"
                              onClick={() => setShowRegisterPassword((current) => !current)}
                              aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                              sx={{ minWidth: 66, borderRadius: 999, fontWeight: 950 }}
                            >
                              {showRegisterPassword ? 'Hide' : 'Show'}
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Use a valid email address. Password must be at least 8 characters and include a number.
                    </Typography>
                    <Autocomplete
                      disablePortal
                      autoHighlight
                      selectOnFocus
                      clearOnBlur
                      handleHomeEndKeys
                      freeSolo={false}
                      options={universityOptions}
                      value={registerValues.university || null}
                      onChange={(_, nextValue) =>
                        setRegisterValues((current) => ({
                          ...current,
                          university: nextValue || '',
                        }))
                      }
                      isOptionEqualToValue={(option, value) => option === value}
                      noOptionsText="No university found"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="University"
                          required
                          sx={authFieldSx}
                          placeholder="Start typing, then select"
                        />
                      )}
                      required
                    />
                    <Autocomplete
                      disablePortal
                      autoHighlight
                      selectOnFocus
                      clearOnBlur
                      handleHomeEndKeys
                      freeSolo={false}
                      options={courseOptions}
                      value={registerValues.department || null}
                      onChange={(_, nextValue) =>
                        setRegisterValues((current) => ({
                          ...current,
                          department: nextValue || '',
                        }))
                      }
                      isOptionEqualToValue={(option, value) => option === value}
                      noOptionsText="No programme found"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Course of discipline"
                          required
                          sx={authFieldSx}
                          placeholder="Start typing, then select"
                        />
                      )}
                      required
                    />
                    <TextField
                      select
                      label="Level"
                      value={registerValues.level}
                      onChange={(event) =>
                        setRegisterValues((current) => ({ ...current, level: event.target.value }))
                      }
                      required
                      sx={authFieldSx}
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select level</option>
                      {NIGERIAN_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </TextField>
                    <FormControlLabel
                      control={<Checkbox checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} required />}
                      label={
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          I agree to the <Link to="/terms">Terms and Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>.
                        </Typography>
                      }
                    />
                    {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}
                    {status ? <Alert severity="info" sx={{ borderRadius: 3 }}>{status}</Alert> : null}
                    <Button variant="contained" type="submit" disabled={busy} sx={primaryButtonSx}>
                      {busy ? 'Creating account...' : 'Create account'}
                    </Button>
                  </Stack>
                )}
                <Stack className="mobile-auth-links" direction="row" spacing={2} sx={{ color: '#0f766e', fontWeight: 900 }}>
                  <Link to="/terms">Terms and Conditions</Link>
                  <Link to="/privacy">Privacy Policy</Link>
                </Stack>
              </Stack>
            </CardContent>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}

export default AuthPage;
