import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Typography } from '@mui/material';
import '../styles/theme.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams(); // Extract token from URL
  const navigate = useNavigate();

  // Clear messages on component mount
  useEffect(() => {
    setMessage('');
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await axios.post(`https://alwon.onrender.com/api/users/reset-password/${token}`, {
        newPassword,
      });

      setMessage(response.data.message || 'Password has been reset successfully.');
      setNewPassword('');
      setConfirmPassword('');
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred while resetting the password.');
      }
    }
  };

  return (
    <div className="login-page">
      {/* ✅ Logo at the top-right corner */}
      <div className="login-logo-wrapper">
        <img src="./logo.png" alt="Company Logo" className="login-logo" />
      </div>

      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Reset Password</h2>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          {message && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              {message}
            </Typography>
          )}

          <button type="submit">Reset Password</button>

          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: 'right', cursor: 'pointer', color: '#1976d2' }}
            onClick={() => navigate('/')}
          >
            Back to Login
          </Typography>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;