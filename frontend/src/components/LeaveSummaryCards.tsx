import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
}

interface User {
  id: string;
  username: string;
}

interface LeaveCard {
  id: string;
  personName: string;
  personId: string;
  startDate: Date;
  endDate: Date;
  businessDays: number;
}

const LeaveSummaryCards: React.FC = () => {
  const [cards, setCards] = useState<LeaveCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leave records and users
        const [leaveResponse, usersResponse] = await Promise.all([
          axios.get('/api/leave', { withCredentials: true }),
          axios.get('/api/users', { withCredentials: true })
        ]);

        const leaveData = leaveResponse.data;
        const usersData = usersResponse.data;
        
        // Handle both array and object responses
        const leaveRecords = Array.isArray(leaveData) ? leaveData : (leaveData.leaveRecords || []);
        const users = Array.isArray(usersData) ? usersData : (usersData.users || []);

        // Create a map of user IDs to usernames
        const userMap = new Map<string, string>();
        users.forEach((user: any) => {
          userMap.set(user.id, user.username);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter to current/upcoming leave only
        const leaveCards: LeaveCard[] = leaveRecords
          .filter((leave: any) => {
            const endDate = new Date(leave.endDate);
            endDate.setHours(0, 0, 0, 0);
            return endDate >= today;
          })
          .map(leave => ({
            id: leave.id,
            personName: userMap.get(leave.userId) || 'Unknown',
            personId: leave.userId,
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            businessDays: leave.businessDays
          }));

        setCards(leaveCards);
        setError(null);
      } catch (err) {
        console.error('Error fetching leave summary:', err);
        setError('Failed to load leave summary');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (card: LeaveCard) => {
    // Navigate to Leave page with pre-selected person
    navigate('/leave', {
      state: {
        selectedPersonId: card.personId,
        scrollToLeave: card.id
      }
    });
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

  if (cards.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No current or upcoming leave scheduled.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        overflowX: 'auto',
        gap: 2,
        pb: 2,
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 4,
        },
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          sx={{
            minWidth: { xs: 280, sm: 320 },
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
              backgroundColor: '#eeeeee',
            },
          }}
          onClick={() => handleCardClick(card)}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '0.938rem', sm: '1rem' } }}>
              {card.personName} is on leave
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
              {format(card.startDate, 'dd/MM/yyyy')} → {format(card.endDate, 'dd/MM/yyyy')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
              ({card.businessDays} business day{card.businessDays !== 1 ? 's' : ''})
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default LeaveSummaryCards;
