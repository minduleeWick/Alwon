import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/theme.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await axios.post('http://localhost:5000/api/users/login', {
      userid: username,
      password,
    });

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('username', res.data.username);
    localStorage.setItem('role', res.data.role);

    navigate('/dashboard');
  } catch (err) {
    alert('Login failed');
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
        <button type="submit">Login</button>
      </form>
    </div>
  </div>
);

};

export default Login;