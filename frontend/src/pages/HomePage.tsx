import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Card, CardContent } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DebtSummaryCard from '../components/DebtSummaryCard';
import LeaveSummaryCards from '../components/LeaveSummaryCards';
import BirthdayBanner from '../components/BirthdayBanner';
import PublicHolidayWidget from '../components/PublicHolidayWidget';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top bar with user identity and settings icon */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.username}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="settings"
            onClick={handleSettingsClick}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Birthday Banner */}
        <BirthdayBanner />

        {/* Public Holiday Widget */}
        <PublicHolidayWidget />

        {/* Navigation Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          mb: 4 
        }}>
          <Card
            sx={{
              flex: 1,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: '#f5f5f5',
              border: '2px solid #000',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                backgroundColor: '#eeeeee',
              },
            }}
            onClick={() => navigate('/debt-tracker')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#000', fontWeight: 'bold' }}>
                $
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#000' }}>
                Debt Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track personal debts
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: '#f5f5f5',
              border: '2px solid #000',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                backgroundColor: '#eeeeee',
              },
            }}
            onClick={() => navigate('/leave')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#000', fontWeight: 'bold' }}>
                ⌚
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#000' }}>
                Leave Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage leave and time off
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: '#f5f5f5',
              border: '2px solid #000',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                backgroundColor: '#eeeeee',
              },
            }}
            onClick={() => navigate('/sales')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#000', fontWeight: 'bold' }}>
                📊
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#000' }}>
                Sales Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track sales and revenue
              </Typography>
            </CardContent>
          </Card>

        </Box>

        {/* Debt Summary */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Debt Summary
          </Typography>
          <DebtSummaryCard refreshKey={refreshKey} />
        </Box>

        {/* Leave Summary Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Leave Summary
          </Typography>
          <LeaveSummaryCards />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
