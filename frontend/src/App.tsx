import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Users from './pages/Users';
import BillHistory from './pages/BillHistory';
import Customers from './pages/Customer';
import CreditBills from './pages/CreditBills';
import ChequePayments from './pages/ChequePayments';
import Pageloader from './pages/Pageloader';
import Chatbot from './pages/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/bill-history" element={<ProtectedRoute><BillHistory /></ProtectedRoute>} />
        <Route path="/customer" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/bill-history/credit" element={<ProtectedRoute><CreditBills /></ProtectedRoute>} />
        <Route path="/bill-history/cheques" element={<ProtectedRoute><ChequePayments /></ProtectedRoute>} />

        {/* Optional utility routes */}

        {/* Optional utility route */}
        <Route path="/pageloader" element={<Pageloader />} />
        <Route path="/chatbot" element={<Chatbot />} />

        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
