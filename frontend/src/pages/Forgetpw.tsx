import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/theme.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/forgot-password', {
        email,
      });

      setMessage(res.data.message || 'Password reset link sent to your email');
      // Optionally navigate or clear form
      setEmail('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error sending reset link');
    }
  };

  return (
    <div className="login-page">
      {/* ✅ Logo or Navigation Option */}
      <div className="login-logo-wrapper">
        <img src="./logo.png" alt="Company Logo" className="login-logo" />
      </div>

      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Forgot Password</h2>
          <p>Enter your registered email to receive a password reset link.</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <button type="submit">Send Reset Link</button>

          {message && <p className="form-message">{message}</p>}

          <div className="back-to-login">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>← Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
