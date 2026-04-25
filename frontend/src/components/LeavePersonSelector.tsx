import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

interface User {
  id: string;
  username: string;
}

interface LeavePersonSelectorProps {
  selectedPersonId: string | null;
  onPersonSelect: (userId: string | null) => void;
}

const LeavePersonSelector: React.FC<LeavePersonSelectorProps> = ({
  selectedPersonId,
  onPersonSelect,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users', { withCredentials: true });
        // Backend returns { users: [...] }
        const usersData = response.data.users || response.data;
        setUsers(Array.isArray(usersData) ? usersData : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleClick = (userId: string) => {
    if (selectedPersonId === userId) {
      // Deselect if already selected
      onPersonSelect(null);
    } else {
      onPersonSelect(userId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Person
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {users.map((user) => {
          const isSelected = selectedPersonId === user.id;
          const isDisabled = selectedPersonId !== null && selectedPersonId !== user.id;
          const isGrey = ['danik', 'lev'].includes(user.username.toLowerCase());
          
          return (
            <Button
              key={user.id}
              variant={isSelected ? 'contained' : 'outlined'}
              onClick={() => handleClick(user.id)}
              sx={{
                minWidth: '150px',
                opacity: isDisabled ? 0.3 : 1,
                transition: 'all 0.3s ease',
                ...(isGrey ? {
                  color: isSelected ? '#fff' : '#757575',
                  backgroundColor: isSelected ? '#757575' : 'transparent',
                  borderColor: '#757575',
                  '&:hover': {
                    backgroundColor: isSelected ? '#616161' : 'rgba(117,117,117,0.08)',
                    borderColor: '#616161',
                    transform: isDisabled ? 'none' : 'scale(1.05)',
                  },
                } : {
                  color: 'primary',
                  '&:hover': {
                    transform: isDisabled ? 'none' : 'scale(1.05)',
                  },
                }),
                '&:focus': {
                  transform: isDisabled ? 'none' : 'scale(1.05)',
                },
              }}
              {...(!isGrey && { color: 'primary' as const })}
            >
              {user.username}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};

export default LeavePersonSelector;
