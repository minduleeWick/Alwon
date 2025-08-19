import React, { useContext, useState } from 'react';
import {
  Avatar, Box, IconButton, Typography, Menu, MenuItem, Switch, FormControlLabel,
  Select, Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import '../styles/topbar.css';
import { ThemeContext } from '../context/ThemeContext';

const TopBar: React.FC = () => {
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  // Get username from localStorage, fallback to 'Admin User'
  const [username] = useState(localStorage.getItem('username') || 'Admin User');

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  // Notification handlers
  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  // Settings menu handlers
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  // Profile dialog handlers
  const handleProfileOpen = () => {
    // setProfileOpen(true);
  };

  // Settings change handlers
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <Box
      className="topbar"
      sx={{
        width: { xs: '100%', sm: '100%', md: 'calc(92% - 270px)' },
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
        left: { xs: 0, md: 220 },
        transition: 'width 0.3s, left 0.3s',
      }}
    >
      <Box />
      <Box display="flex" alignItems="center">
        <IconButton size="small" className="topbar-icon" onClick={handleNotifClick}>
          <NotificationsIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MenuItem onClick={handleNotifClose}>No new notifications</MenuItem>
        </Menu>
        <IconButton size="small" className="topbar-icon" onClick={handleSettingsClick}>
          <SettingsIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleSettingsClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{ sx: { p: 2, minWidth: 220 } }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={theme === 'dark'}
                onChange={toggleTheme}
                color="primary"
              />
            }
            label="Dark Mode"
            sx={{ ml: 1 }}
          />
          <Divider sx={{ my: 1 }} />
          <FormControlLabel
            control={
              <Switch
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Notifications"
            sx={{ ml: 1 }}
          />
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ ml: 1, mt: 1 }}>
            Language
          </Typography>
          <Select
            value={language}
            onChange={e => setLanguage(e.target.value as string)}
            fullWidth
            size="small"
            sx={{ ml: 1, mt: 1, mb: 1 }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Tamil</MenuItem>
            <MenuItem value="fr">Sinhala</MenuItem>
          </Select>
        </Menu>
        <Avatar
          sx={{
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            cursor: 'pointer',
            ml: 1
          }}
          onClick={handleProfileOpen}
        >
          {username[0]}
        </Avatar>
        <Typography
          variant="body1"
          ml={1}
          className="topbar-username"
          sx={{
            display: { xs: 'none', sm: 'block' },
            cursor: 'pointer',
            fontSize: { xs: '0.95rem', sm: '1rem' }
          }}
          onClick={handleProfileOpen}
        >
          {username}
        </Typography>
      </Box>
      {/* Profile Edit Dialog */}
      {/* ...existing profile dialog code... */}
    </Box>
  );
};

export default TopBar;