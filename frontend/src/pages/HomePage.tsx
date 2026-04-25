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
            <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 4 } }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#000', fontWeight: 'bold', fontSize: { xs: '2rem', sm: '2.125rem' } }}>
                $
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#000', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Debt Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
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
            <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 4 } }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#000', fontWeight: 'bold', fontSize: { xs: '2rem', sm: '2.125rem' } }}>
                ⌚
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#000', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Leave Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
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
            <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px' }}>
                  <rect x="8" y="20" width="8" height="20" fill="#333333" />
                  <rect x="20" y="12" width="8" height="28" fill="#555555" />
                  <rect x="32" y="8" width="8" height="32" fill="#777777" />
                </svg>
              </Box>
              <Typography variant="h5" gutterBottom sx={{ color: '#000', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Sales Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                Track sales and revenue
              </Typography>
            </CardContent>
          </Card>

        </Box>

        {/* Debt Summary */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Debt Summary
          </Typography>
          <DebtSummaryCard refreshKey={refreshKey} />
        </Box>

        {/* Leave Summary Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Leave Summary
          </Typography>
          <LeaveSummaryCards />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
