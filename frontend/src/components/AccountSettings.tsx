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
  Divider,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  
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
    </Box>
  );
};

export default AccountSettings;
