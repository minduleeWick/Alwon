import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';
import '../styles/theme.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', {
        username,
        password,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);

      setErrorMsg('');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg('Invalid username or password');
    }
  };

  const handleDialogOpen = () => setOpenDialog(true);
  const handleDialogClose = () => {
    setOpenDialog(false);
    setResetUsername('');
    setDialogMessage('');
    if (dialogMessage.includes('successfully')) {
      navigate('/'); // Navigate to login page on success
    }
  };

  const handleResetSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/forgot-password', {
        username: resetUsername,
      });

      setDialogMessage(res.data.message || 'Password reset request sent successfully');
      setResetUsername('');
    } catch (err: any) {
      setDialogMessage(err.response?.data?.message || 'Error sending reset request');
    }
  };

  return (
    <div className="login-page">
      {/* ✅ Logo at the top-right corner */}
      <div className="login-logo-wrapper">
        <img src="./logo.png" alt="Company Logo" className="login-logo" />
      </div>

      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Login</h2>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
          />

          {errorMsg && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {errorMsg}
            </Typography>
          )}

          <button type="submit">Login</button>

          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: 'right', cursor: 'pointer', color: '#1976d2' }}
            onClick={handleDialogOpen}
          >
            Forgot Password?
          </Typography>
        </form>
      </div>

      {/* 🔒 Forgot Password Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your username and We'll send you a password.
          </Typography>
          <TextField
            fullWidth
            label="Username"
            type="text"
            value={resetUsername}
            onChange={e => setResetUsername(e.target.value)}
            required
          />
          {dialogMessage && (
            <Typography
              variant="body2"
              color={dialogMessage.includes('Error') ? 'error' : 'success'}
              sx={{ mt: 2 }}
            >
              {dialogMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleResetSubmit}
            disabled={!resetUsername.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;