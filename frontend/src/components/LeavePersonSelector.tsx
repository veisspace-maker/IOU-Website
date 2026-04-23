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
          
          return (
            <Button
              key={user.id}
              variant={isSelected ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleClick(user.id)}
              sx={{
                minWidth: '150px',
                opacity: isDisabled ? 0.3 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: isDisabled ? 'none' : 'scale(1.05)',
                },
                '&:focus': {
                  transform: isDisabled ? 'none' : 'scale(1.05)',
                },
              }}
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
