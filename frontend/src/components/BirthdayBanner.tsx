import React, { useEffect, useState } from 'react';
import { Box, Alert, AlertTitle, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface BirthdayWithAge {
  id: string;
  name: string;
  dateOfBirth: string;
  turningAge: number;
  isToday: boolean;
}

const BirthdayBanner: React.FC = () => {
  const [birthdays, setBirthdays] = useState<BirthdayWithAge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodaysBirthdays = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/birthdays/today', {
          withCredentials: true
        });
        
        // Handle both array and object responses
        const data = Array.isArray(response.data) ? response.data : (response.data.birthdays || []);
        
        // Filter to only birthdays that are today
        const todaysBirthdays = data.filter((b: any) => b.isToday);
        setBirthdays(todaysBirthdays);
        setError(null);
      } catch (err) {
        console.error('Error fetching birthdays:', err);
        setError('Failed to load birthdays');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysBirthdays();
  }, []);

  const handleBannerClick = () => {
    // Navigate to Settings > Birthdays (tab index 3)
    navigate('/settings', {
      state: {
        openTab: 3
      }
    });
  };

  if (loading) {
    return null; // Don't show loading spinner for banner
  }

  if (error || birthdays.length === 0) {
    return null; // Don't show banner if no birthdays or error
  }

  // Format the birthday message
  const formatBirthdayMessage = () => {
    if (birthdays.length === 1) {
      const birthday = birthdays[0];
      return `🎉 Today is ${birthday.name}'s birthday – turning ${birthday.turningAge}`;
    } else {
      // Multiple birthdays
      const names = birthdays.map(b => `${b.name} (turning ${b.turningAge})`).join(', ');
      return `🎉 Today's birthdays: ${names}`;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity="info"
        sx={{
          cursor: 'pointer',
          transition: 'transform 0.2s',
          backgroundColor: '#e0e0e0',
          color: '#000',
          border: '1px solid #bdbdbd',
          '& .MuiAlert-icon': {
            color: '#666',
          },
          '&:hover': {
            transform: 'scale(1.02)',
            backgroundColor: '#d0d0d0',
          },
        }}
        onClick={handleBannerClick}
      >
        <AlertTitle sx={{ fontWeight: 'bold', color: '#000' }}>Birthday Today!</AlertTitle>
        {formatBirthdayMessage()}
      </Alert>
    </Box>
  );
};

export default BirthdayBanner;
