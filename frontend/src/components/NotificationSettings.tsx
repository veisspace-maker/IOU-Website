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

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setNotificationsSupported(false);
      return;
    }

    // Check current permission status
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      setTestMessage('Notifications enabled! You will receive birthday reminders.');
    } else {
      setTestMessage('Notification permission denied. Please enable in your browser settings.');
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
          Your browser does not support notifications.
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

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationsEnabled}
              onChange={handleEnableNotifications}
              disabled={notificationsEnabled && Notification.permission === 'granted'}
            />
          }
          label={notificationsEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
        />
      </Box>

      {!notificationsEnabled && (
        <Button
          variant="contained"
          onClick={handleEnableNotifications}
          sx={{ mb: 2, mr: 2 }}
        >
          Enable Notifications
        </Button>
      )}

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
