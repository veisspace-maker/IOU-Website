import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LeavePersonSelector from '../components/LeavePersonSelector';
import LeaveEntryForm from '../components/LeaveEntryForm';
import LeaveCalendar from '../components/LeaveCalendar';
import LeaveHistory from '../components/LeaveHistory';
import LeaveModal from '../components/LeaveModal';
import axios from 'axios';

interface User {
  id: string;
  username: string;
}

interface LeavePageProps {}

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
}

const LeavePage: React.FC<LeavePageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Person selection state
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leaveKey, setLeaveKey] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [prefilledDates, setPrefilledDates] = useState<{ startDate?: string; endDate?: string } | null>(null);

  // Handle pre-selection from navigation state
  useEffect(() => {
    if (location.state) {
      const state = location.state as { 
        selectedPersonId?: string;
        startDate?: string;
        endDate?: string;
      };
      if (state.selectedPersonId) {
        setSelectedPersonId(state.selectedPersonId);
      }
      if (state.startDate && state.endDate) {
        setPrefilledDates({
          startDate: state.startDate,
          endDate: state.endDate,
        });
      }
      // Clear the state after reading
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleBack = () => {
    navigate('/');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLeaveCreated = () => {
    // Trigger refresh of leave components
    setLeaveKey((prev) => prev + 1);
  };

  const handleLeaveUpdated = () => {
    // Trigger refresh of leave components
    setLeaveKey((prev) => prev + 1);
    // Close the modal
    setSelectedLeave(null);
  };

  const handleLeaveClick = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
  };

  const handleCloseModal = () => {
    setSelectedLeave(null);
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users', { withCredentials: true });
        // Backend returns { users: [...] }
        const usersData = response.data.users || response.data;
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Get selected person name
  const selectedPersonName = users.find((u) => u.id === selectedPersonId)?.username || '';

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
            Leave Tracker
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mr: 2,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {user?.username}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="settings"
            onClick={handleSettings}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* PersonSelector */}
        <Box sx={{ mb: 3 }}>
          <LeavePersonSelector
            selectedPersonId={selectedPersonId}
            onPersonSelect={setSelectedPersonId}
          />
        </Box>

        {/* LeaveEntryForm */}
        {selectedPersonId && (
          <Box sx={{ mb: 3 }}>
            <LeaveEntryForm
              selectedPersonId={selectedPersonId}
              selectedPersonName={selectedPersonName}
              onLeaveCreated={handleLeaveCreated}
              prefilledStartDate={prefilledDates?.startDate}
              prefilledEndDate={prefilledDates?.endDate}
            />
          </Box>
        )}

        {/* LeaveCalendar */}
        <Box sx={{ mb: 3 }}>
          <LeaveCalendar
            selectedPersonId={selectedPersonId}
            refreshKey={leaveKey}
          />
        </Box>

        {/* LeaveHistory */}
        <Box sx={{ mb: 3 }}>
          <LeaveHistory
            refreshKey={leaveKey}
            onLeaveClick={handleLeaveClick}
          />
        </Box>
      </Box>

      {/* LeaveModal */}
      {selectedLeave && (
        <LeaveModal
          open={!!selectedLeave}
          leave={selectedLeave}
          users={users}
          onClose={handleCloseModal}
          onLeaveUpdated={handleLeaveUpdated}
        />
      )}
    </Box>
  );
};

export default LeavePage;
