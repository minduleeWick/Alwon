// ---- frontend/src/components/TopBar.tsx ----
import React from 'react';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';

const TopBar: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: 64,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingX: 3,
        boxShadow: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <IconButton>
        <NotificationsIcon />
      </IconButton>
      <IconButton>
        <SettingsIcon />
      </IconButton>
      <Box display="flex" alignItems="center" ml={2}>
        <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
        <Typography variant="body1" ml={1}>
          Admin User
        </Typography>
      </Box>
    </Box>
  );
};

export default TopBar;
