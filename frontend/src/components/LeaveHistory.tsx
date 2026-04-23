import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
}

interface LeaveHistoryProps {
  refreshKey: number;
  onLeaveClick: (leave: LeaveRecord) => void;
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  refreshKey,
  onLeaveClick,
}) => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Save scroll position before refresh
        if (scrollContainerRef.current) {
          scrollPositionRef.current = scrollContainerRef.current.scrollTop;
        }

        setLoading(true);

        // Fetch leave records
        const leaveResponse = await axios.get(
          '/api/leave',
          { withCredentials: true }
        );
        // Backend returns { leaveRecords: [...] }
        const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
        setLeaveRecords(Array.isArray(leaveData) ? leaveData : []);

        // Fetch users
        const usersResponse = await axios.get(
          '/api/users',
          { withCredentials: true }
        );
        // Backend returns { users: [...] }
        const usersData = usersResponse.data.users || usersResponse.data;
        setUsers(Array.isArray(usersData) ? usersData : []);

        setError(null);
      } catch (err) {
        console.error('Error fetching leave history:', err);
        setError('Failed to load leave history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [loading, leaveRecords]);

  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return user?.username || 'Unknown';
  };

  const formatLeaveLabel = (leave: LeaveRecord): string => {
    if (leave.businessDays === 1) {
      return 'Day Off';
    }
    return `${leave.businessDays} business days`;
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (leaveRecords.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Leave History
        </Typography>
        <Typography color="text.secondary">No leave records found</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Leave History
      </Typography>

      <Box
        ref={scrollContainerRef}
        sx={{
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <List>
          {leaveRecords.map((leave) => (
            <ListItem key={leave.id} disablePadding>
              <ListItemButton onClick={() => onLeaveClick(leave)}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1" component="span" sx={{ fontWeight: 'bold' }}>
                        {getUserName(leave.userId)}
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary">
                        {format(new Date(leave.startDate), 'dd/MM/yyyy')} → {format(new Date(leave.endDate), 'dd/MM/yyyy')}
                      </Typography>
                      <Chip
                        label={formatLeaveLabel(leave)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default LeaveHistory;
