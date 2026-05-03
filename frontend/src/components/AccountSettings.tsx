import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';

const AccountSettings: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();
  
  // Username change state
  const [newUsername, setNewUsername] = useState('');
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Confirmation dialogs
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Two-factor authentication
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ qrCodeUrl: string; secret: string } | null>(null);
  const [twoFactorEnableCode, setTwoFactorEnableCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);
  const [setup2faLoading, setSetup2faLoading] = useState(false);
  const [enable2faLoading, setEnable2faLoading] = useState(false);
  const [showDisable2faDialog, setShowDisable2faDialog] = useState(false);
  const [disable2faPassword, setDisable2faPassword] = useState('');
  const [disable2faLoading, setDisable2faLoading] = useState(false);
  const [disable2faError, setDisable2faError] = useState<string | null>(null);

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }
    
    if (!usernameCurrentPassword) {
      setUsernameError('Current password is required');
      return;
    }
    
    setShowUsernameConfirm(true);
  };

  const confirmUsernameChange = async () => {
    setShowUsernameConfirm(false);
    setUsernameLoading(true);
    setUsernameError(null);
    setUsernameSuccess(null);

    try {
      await axios.put(
        `/api/users/${user?.id}`,
        {
          username: newUsername,
          currentPassword: usernameCurrentPassword,
        },
        { withCredentials: true }
      );

      setUsernameSuccess('Username updated successfully');
      setNewUsername('');
      setUsernameCurrentPassword('');
      
      // Refresh the page to update the user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update username';
      setUsernameError(errorMessage);
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setShowPasswordConfirm(true);
  };

  const confirmPasswordChange = async () => {
    setShowPasswordConfirm(false);
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await axios.put(
        `/api/users/${user?.id}`,
        {
          password: newPassword,
          currentPassword: currentPassword,
        },
        { withCredentials: true }
      );

      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update password';
      const details = err.response?.data?.details;
      
      if (details && Array.isArray(details)) {
        setPasswordError(`${errorMessage}: ${details.join(', ')}`);
      } else {
        setPasswordError(errorMessage);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleStart2faSetup = async () => {
    setTwoFactorError(null);
    setTwoFactorSuccess(null);
    setDisable2faError(null);
    setSetup2faLoading(true);
    try {
      const res = await axios.post<{ secret: string; qrCodeUrl: string }>(
        '/api/auth/2fa/setup',
        {},
        { withCredentials: true }
      );
      setTwoFactorSetup({ secret: res.data.secret, qrCodeUrl: res.data.qrCodeUrl });
      setTwoFactorEnableCode('');
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setSetup2faLoading(false);
    }
  };

  const handleCancel2faSetup = () => {
    setTwoFactorSetup(null);
    setTwoFactorEnableCode('');
    setTwoFactorError(null);
  };

  const handleEnable2fa = async () => {
    const code = twoFactorEnableCode.replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      setTwoFactorError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setTwoFactorError(null);
    setEnable2faLoading(true);
    try {
      await axios.post('/api/auth/2fa/enable', { token: code }, { withCredentials: true });
      await checkAuth();
      setTwoFactorSuccess('Two-factor authentication is now enabled.');
      setTwoFactorSetup(null);
      setTwoFactorEnableCode('');
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.error || 'Could not enable 2FA');
    } finally {
      setEnable2faLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    if (!disable2faPassword) {
      setDisable2faError('Password is required');
      return;
    }
    setDisable2faError(null);
    setDisable2faLoading(true);
    try {
      await axios.post('/api/auth/2fa/disable', { password: disable2faPassword }, { withCredentials: true });
      await checkAuth();
      setTwoFactorSuccess('Two-factor authentication has been disabled.');
      setShowDisable2faDialog(false);
      setDisable2faPassword('');
    } catch (err: any) {
      setDisable2faError(err.response?.data?.error || 'Could not disable 2FA');
    } finally {
      setDisable2faLoading(false);
    }
  };

  const openDisable2faDialog = () => {
    setDisable2faPassword('');
    setDisable2faError(null);
    setShowDisable2faDialog(true);
  };

  return (
    <Box>
      {/* Change Username Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change Username
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current username: <strong>{user?.username}</strong>
        </Typography>
        
        {usernameError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUsernameError(null)}>
            {usernameError}
          </Alert>
        )}
        
        {usernameSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUsernameSuccess(null)}>
            {usernameSuccess}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="New Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          sx={{ mb: 2 }}
          disabled={usernameLoading}
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          fullWidth
          type="password"
          label="Current Password"
          value={usernameCurrentPassword}
          onChange={(e) => setUsernameCurrentPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={usernameLoading}
          InputLabelProps={{ shrink: true }}
        />
        
        <Button
          variant="contained"
          onClick={handleUsernameChange}
          disabled={usernameLoading || !newUsername || !usernameCurrentPassword}
        >
          Update Username
        </Button>
      </Paper>

      {/* Change Password Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>
        
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
            {passwordError}
          </Alert>
        )}
        
        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess(null)}>
            {passwordSuccess}
          </Alert>
        )}
        
        <TextField
          fullWidth
          type="password"
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={passwordLoading}
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          fullWidth
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={passwordLoading}
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          fullWidth
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={passwordLoading}
          InputLabelProps={{ shrink: true }}
        />
        
        <Button
          variant="contained"
          onClick={handlePasswordChange}
          disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
        >
          Update Password
        </Button>
      </Paper>

      {/* Two-factor authentication */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Two-factor authentication
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.) for an extra step at
          login.
        </Typography>

        {twoFactorError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTwoFactorError(null)}>
            {twoFactorError}
          </Alert>
        )}
        {twoFactorSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setTwoFactorSuccess(null)}>
            {twoFactorSuccess}
          </Alert>
        )}

        {user?.twoFactorEnabled ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Two-factor authentication is enabled for your account.
            </Alert>
            <Button variant="outlined" color="warning" onClick={openDisable2faDialog}>
              Disable two-factor authentication
            </Button>
          </Box>
        ) : twoFactorSetup ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Scan the QR code with your authenticator app, or add the secret key manually.
            </Typography>
            {twoFactorSetup.qrCodeUrl ? (
              <Box
                sx={{
                  bgcolor: 'background.default',
                  p: 2,
                  display: 'inline-block',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  mb: 2,
                }}
              >
                <QRCode value={twoFactorSetup.qrCodeUrl} size={200} />
              </Box>
            ) : null}
            <Typography variant="caption" display="block" sx={{ mb: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {twoFactorSetup.secret}
            </Typography>
            <TextField
              fullWidth
              label="6-digit verification code"
              value={twoFactorEnableCode}
              onChange={(e) => setTwoFactorEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code' }}
              disabled={enable2faLoading}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleEnable2fa} disabled={enable2faLoading}>
                {enable2faLoading ? 'Verifying…' : 'Enable two-factor authentication'}
              </Button>
              <Button variant="text" onClick={handleCancel2faSetup} disabled={enable2faLoading}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Button variant="contained" onClick={handleStart2faSetup} disabled={setup2faLoading}>
            {setup2faLoading ? 'Preparing…' : 'Set up authenticator'}
          </Button>
        )}
      </Paper>

      {/* Logout Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Logout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          End your current session and return to the login screen.
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Paper>

      {/* Confirmation Dialogs */}
      <Dialog open={showUsernameConfirm} onClose={() => setShowUsernameConfirm(false)}>
        <DialogTitle>Confirm Username Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change your username to "{newUsername}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUsernameConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmUsernameChange} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPasswordConfirm} onClose={() => setShowPasswordConfirm(false)}>
        <DialogTitle>Confirm Password Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change your password?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmPasswordChange} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmLogout} variant="contained" color="error">
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDisable2faDialog}
        onClose={() => !disable2faLoading && setShowDisable2faDialog(false)}
      >
        <DialogTitle>Disable two-factor authentication</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter your account password to turn off two-factor authentication.
          </DialogContentText>
          {disable2faError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDisable2faError(null)}>
              {disable2faError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Password"
            value={disable2faPassword}
            onChange={(e) => setDisable2faPassword(e.target.value)}
            disabled={disable2faLoading}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisable2faDialog(false)} disabled={disable2faLoading} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleDisable2fa} variant="contained" color="warning" disabled={disable2faLoading}>
            {disable2faLoading ? 'Disabling…' : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountSettings;
