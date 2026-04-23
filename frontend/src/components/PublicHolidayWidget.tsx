import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
}

const PublicHolidayWidget: React.FC = () => {
  const [holiday, setHoliday] = useState<PublicHoliday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextHoliday = async () => {
      try {
        setLoading(true);
        const response = await axios.get<PublicHoliday>('/api/holidays/next', {
          withCredentials: true
        });
        setHoliday(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching next holiday:', err);
        // Don't set error if no holiday found (404)
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setHoliday(null);
        } else {
          setError('Failed to load holiday information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNextHoliday();
  }, []);

  if (loading) {
    return null; // Don't show loading for widget
  }

  if (error) {
    return null; // Don't show widget on error
  }

  if (!holiday) {
    return null; // Don't show widget if no upcoming holiday
  }

  // Safely parse and format the date
  let formattedDate = '';
  try {
    const holidayDate = new Date(holiday.date);
    if (!isNaN(holidayDate.getTime())) {
      formattedDate = format(holidayDate, 'MMMM d, yyyy');
    } else {
      return null; // Invalid date, don't show widget
    }
  } catch (err) {
    return null; // Error formatting date, don't show widget
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          backgroundColor: '#e0e0e0',
          color: '#000',
          border: '1px solid #bdbdbd',
        }}
      >
        <Typography variant="body1">
          <strong>Next public holiday:</strong> {holiday.name} – {formattedDate}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PublicHolidayWidget;
