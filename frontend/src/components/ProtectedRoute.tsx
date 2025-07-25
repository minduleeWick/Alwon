// frontend/src/components/ProtectedRoute.tsx
import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


interface DecodedToken {
  exp: number;
  [key: string]: any;
}

const isTokenValid = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('token'); // Clear invalid token
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
