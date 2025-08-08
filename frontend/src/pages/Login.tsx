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

const API_BASE = 'https://alwon.onrender.com/api/users';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        username,
        password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);
      setLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(
        err.response?.data?.error ||
        'Invalid username or password'
      );
    }
  };

  // Open forgot password dialog
  const handleDialogOpen = () => setOpenDialog(true);

  // Close forgot password dialog
  const handleDialogClose = () => {
    setOpenDialog(false);
    setResetUsername('');
    setDialogMessage('');
    if (dialogMessage.toLowerCase().includes('success')) {
      navigate('/');
    }
  };

  // Handle forgot password submit
  const handleResetSubmit = async () => {
    setDialogMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/forgot-password`, {
        username: resetUsername,
      });
      setDialogMessage(res.data.message || 'Password reset request sent successfully');
      setResetUsername('');
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setDialogMessage(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error sending reset request'
      );
    }
  };

  return (
    <div className="login-page">
      {/* Logo at the top-right corner */}
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
            disabled={loading}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            disabled={loading}
          />

          {errorMsg && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {errorMsg}
            </Typography>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: 'right', cursor: 'pointer', color: '#1976d2' }}
            onClick={handleDialogOpen}
          >
            Forgot Password?
          </Typography>
        </form>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your username and we'll send you a password reset link.
          </Typography>
          <TextField
            fullWidth
            label="Username"
            type="text"
            value={resetUsername}
            onChange={e => setResetUsername(e.target.value)}
            required
            disabled={loading}
          />
          {dialogMessage && (
            <Typography
              variant="body2"
              color={dialogMessage.toLowerCase().includes('error') ? 'error' : 'success'}
              sx={{ mt: 2 }}
            >
              {dialogMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleResetSubmit}
            disabled={!resetUsername.trim() || loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;