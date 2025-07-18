import React from 'react';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import '../styles/topbar.css';

const TopBar: React.FC = () => {
  return (
    <Box
      className="topbar"
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1, sm: 2, md: 3 },
        boxShadow: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: { xs: 48, sm: 56, md: 64 },
      }}
    >
      {/* Left side: Avatar and Username */}
      <Box display="flex" alignItems="center">
        <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}>A</Avatar>
        <Typography
          variant="body1"
          ml={1}
          className="topbar-username"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          Admin User
        </Typography>
      </Box>
      {/* Right side: Icons */}
      <Box>
        <IconButton size="small" className="topbar-icon">
          <NotificationsIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" className="topbar-icon">
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default TopBar;