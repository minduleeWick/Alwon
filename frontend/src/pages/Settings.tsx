import React, { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Select, MenuItem, Paper, Divider } from '@mui/material';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  // You should lift darkMode state up to App and use ThemeProvider for real theme switching
  const handleDarkModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDarkMode(event.target.checked);
    // TODO: Implement actual theme switching in your App component
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 4, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={handleDarkModeChange}
              color="primary"
            />
          }
          label="Dark Mode"
        />

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={notifications}
              onChange={e => setNotifications(e.target.checked)}
              color="primary"
            />
          }
          label="Enable Notifications"
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Language
        </Typography>
        <Select
          value={language}
          onChange={e => setLanguage(e.target.value as string)}
          fullWidth
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="es">Spanish</MenuItem>
          <MenuItem value="fr">French</MenuItem>
        </Select>
      </Paper>
    </Box>
  );
};

export default Settings;