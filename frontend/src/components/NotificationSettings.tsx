import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { notificationService } from '../utils/notificationService';
import axios from 'axios';

const NotificationSettings: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setNotificationsSupported(false);
      return;
    }

    // Log current state for debugging
    console.log('Notification API available:', 'Notification' in window);
    console.log('Current permission:', Notification.permission);
    console.log('Is secure context (HTTPS):', window.isSecureContext);

    // Check current permission status
    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);
    setNotificationsEnabled(currentPermission === 'granted');
  }, []);

  const handleEnableNotifications = async () => {
    console.log('Button clicked - Current permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      setTestMessage('Notifications were previously blocked. Please reset permissions in your browser settings (see instructions below).');
      return;
    }

    if (Notification.permission === 'granted') {
      setTestMessage('Notifications are already enabled!');
      // Send a test notification
      setTimeout(() => {
        notificationService.sendBirthdayNotification({
          id: 'test-' + Date.now(),
          name: 'Test',
          turningAge: 25,
          daysUntil: 7,
        }, true);
      }, 500);
      return;
    }

    try {
      console.log('Calling Notification.requestPermission()...');
      const granted = await notificationService.requestPermission();
      console.log('Permission result:', granted);
      
      const newPermission = Notification.permission;
      setPermissionState(newPermission);
      setNotificationsEnabled(granted);
      
      if (granted) {
        setTestMessage('✓ Notifications enabled! Sending test notification...');
        // Send a test notification to confirm it works
        setTimeout(() => {
          notificationService.sendBirthdayNotification({
            id: 'welcome-' + Date.now(),
            name: 'System',
            turningAge: 0,
            daysUntil: 7,
          }, true);
        }, 500);
      } else {
        setTestMessage('Permission was not granted. The popup should have appeared - did you see it?');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setTestMessage('Error requesting notification permission: ' + (error as Error).message);
    }
  };

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      setTestMessage('Please enable notifications first.');
      return;
    }

    try {
      // Send a test notification
      await notificationService.sendBirthdayNotification({
        id: 'test',
        name: 'Test Person',
        turningAge: 25,
        daysUntil: 7,
      });
      setTestMessage('Test notification sent! Check your notifications.');
    } catch (error) {
      setTestMessage('Failed to send test notification.');
    }
  };

  const handleCheckNow = async () => {
    if (!notificationsEnabled) {
      setTestMessage('Please enable notifications first.');
      return;
    }

    try {
      setTestMessage('Checking for upcoming birthdays...');
      
      const response = await axios.get('/api/birthdays/upcoming', {
        withCredentials: true,
      });

      const total = 
        response.data.today.length + 
        response.data.in3Days.length + 
        response.data.in7Days.length;

      if (total === 0) {
        setTestMessage('No upcoming birthdays in the next 7 days.');
      } else {
        setTestMessage(`Found ${total} upcoming birthday(s). Notifications sent!`);
        
        // Manually trigger notifications
        const notifications = [
          ...response.data.today.map((b: any) => ({ ...b, daysUntil: 0 as const })),
          ...response.data.in3Days.map((b: any) => ({ ...b, daysUntil: 3 as const })),
          ...response.data.in7Days.map((b: any) => ({ ...b, daysUntil: 7 as const })),
        ];
        
        await notificationService.sendBirthdayNotifications(notifications);
      }
    } catch (error) {
      setTestMessage('Failed to check birthdays.');
    }
  };

  const handleClearHistory = () => {
    notificationService.clearNotificationHistory();
    setTestMessage('Notification history cleared. You can now receive duplicate notifications for testing.');
  };

  if (!notificationsSupported) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="warning">
          Your browser does not support desktop notifications. Please use a modern browser like Chrome, Firefox, or Edge.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {notificationsEnabled ? (
          <NotificationsIcon sx={{ mr: 1, color: 'success.main' }} />
        ) : (
          <NotificationsOffIcon sx={{ mr: 1, color: 'text.secondary' }} />
        )}
        <Typography variant="h6">
          Birthday Notifications
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get notified about upcoming birthdays 7 days before, 3 days before, and on the day.
      </Typography>

      {testMessage && (
        <Alert 
          severity={testMessage.includes('Failed') || testMessage.includes('denied') ? 'error' : 'info'}
          sx={{ mb: 2 }}
          onClose={() => setTestMessage(null)}
        >
          {testMessage}
        </Alert>
      )}

      {!notificationsEnabled && Notification.permission === 'default' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Click the button below to enable notifications.</strong>
          <br />
          Your browser will show a popup asking for permission. Click "Allow" to enable birthday notifications.
        </Alert>
      )}

      {!notificationsEnabled && Notification.permission === 'denied' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Notifications are blocked.</strong> You previously denied permission. To enable them, you need to reset the permission in your browser:
          <br /><br />
          <strong>Chrome/Edge:</strong> Click the lock/info icon (🔒) in the address bar → Site settings → Notifications → Change to "Allow"
          <br />
          <strong>Firefox:</strong> Click the lock icon → Connection secure → More information → Permissions tab → Notifications → Remove or change to "Allow"
          <br />
          <strong>Safari:</strong> Safari menu → Settings for This Website → Notifications → Allow
          <br /><br />
          After changing the setting, refresh this page and try again.
        </Alert>
      )}

      <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Current Status:</strong> {permissionState === 'granted' ? '✓ Granted' : permissionState === 'denied' ? '✗ Denied' : '? Not Asked Yet'}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        {!notificationsEnabled && (
          <Button
            variant="contained"
            size="large"
            onClick={handleEnableNotifications}
            startIcon={<NotificationsIcon />}
            sx={{ mb: 2 }}
          >
            Enable Notifications
          </Button>
        )}
        
        {notificationsEnabled && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Notifications are enabled and working!
          </Alert>
        )}
      </Box>

      {notificationsEnabled && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handleTestNotification}
          >
            Send Test Notification
          </Button>
          <Button
            variant="outlined"
            onClick={handleCheckNow}
          >
            Check Birthdays Now
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearHistory}
            color="secondary"
          >
            Clear Notification History
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>How it works:</strong>
          <br />
          • Notifications are checked automatically every hour
          <br />
          • You'll receive reminders 7 days before, 3 days before, and on the birthday
          <br />
          • Each notification is sent only once per day
          <br />
          • Make sure your browser allows notifications for this site
        </Typography>
      </Box>
    </Paper>
  );
};

export default NotificationSettings;
