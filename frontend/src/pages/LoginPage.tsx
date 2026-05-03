import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password, rememberMe);

      if (result.error) {
        setError(result.error);
      } else if (result.requiresTwoFactor) {
        setShowTwoFactor(true);
      } else {
        // Successful login without 2FA - navigate to home
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verify2FA(twoFactorToken);

      if (!result.success) {
        setError(result.error || '2FA verification failed');
      } else {
        // Successful 2FA verification - navigate to home
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowTwoFactor(false);
    setTwoFactorToken('');
    setError('');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, sm: 0 },
        }}
      >
        <Paper elevation={3} sx={{ padding: { xs: 3, md: 4 }, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            UOMe
          </Typography>

          {!showTwoFactor ? (
            <>
              <Typography component="h2" variant="h6" align="center" gutterBottom>
                Sign In
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Remember me"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography component="h2" variant="h6" align="center" gutterBottom>
                Two-Factor Authentication
              </Typography>

              <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                Enter the 6-digit code from your authenticator app
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleVerify2FA} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="twoFactorToken"
                  label="Authentication Code"
                  name="twoFactorToken"
                  autoComplete="off"
                  autoFocus
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back to Login
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
