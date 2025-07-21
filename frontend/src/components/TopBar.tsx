import React, { useState } from 'react';
import { Avatar, Box, IconButton, Typography, Menu, MenuItem, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import '../styles/topbar.css';

const TopBar: React.FC = () => {
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState('Admin User');
  const [editName, setEditName] = useState(username);
  const navigate = useNavigate();

  // Notification handlers
  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  // Settings navigation
  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Profile dialog handlers
  const handleProfileOpen = () => {
    setEditName(username);
    setProfileOpen(true);
  };
  const handleProfileClose = () => {
    setProfileOpen(false);
  };
  const handleProfileSave = () => {
    setUsername(editName);
    setProfileOpen(false);
  };

  return (
    <Box
      className="topbar"
      sx={{
        width: '81.1%',
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
      {/* Left side: (empty or add logo/title here if needed) */}
      <Box />
      {/* Right side: Notification, Settings, Avatar, Username */}
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
        <Avatar
          sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, cursor: 'pointer', ml: 1 }}
          onClick={handleProfileOpen}
        >
          {username[0]}
        </Avatar>
        <Typography
          variant="body1"
          ml={1}
          className="topbar-username"
          sx={{ display: { xs: 'none', sm: 'block' }, cursor: 'pointer' }}
          onClick={handleProfileOpen}
        >
          {username}
        </Typography>
      </Box>
      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onClose={handleProfileClose}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileClose}>Cancel</Button>
          <Button onClick={handleProfileSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopBar;