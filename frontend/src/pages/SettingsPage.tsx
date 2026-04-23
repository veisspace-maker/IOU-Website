import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccountSettings from '../components/AccountSettings';
import ClosedDatesManager from '../components/ClosedDatesManager';
import PublicHolidaysManager from '../components/PublicHolidaysManager';
import BirthdaysManager from '../components/BirthdaysManager';
import NotificationSettings from '../components/NotificationSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we should open a specific tab (e.g., from birthday banner)
  const initialTab = location.state?.openTab || 0;
  const [currentTab, setCurrentTab] = useState(initialTab);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Settings - {user?.username}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Paper square elevation={0}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Account" id="settings-tab-0" />
          <Tab label="Closed Dates" id="settings-tab-1" />
          <Tab label="Public Holidays" id="settings-tab-2" />
          <Tab label="Birthdays" id="settings-tab-3" />
          <Tab label="Notifications" id="settings-tab-4" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        <AccountSettings />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <ClosedDatesManager />
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        <PublicHolidaysManager />
      </TabPanel>
      <TabPanel value={currentTab} index={3}>
        <BirthdaysManager />
      </TabPanel>
      <TabPanel value={currentTab} index={4}>
        <NotificationSettings />
      </TabPanel>
    </Box>
  );
};

export default SettingsPage;
