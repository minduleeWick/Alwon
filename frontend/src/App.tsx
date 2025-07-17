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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/bill-history" element={<BillHistory />} />
        <Route path="/customer" element={<Customers />} />
        <Route path="/bill-history/credit" element={<CreditBills />} />
        <Route path="/bill-history/cheques" element={<ChequePayments />} />




      </Routes>
    </Router>
  );
}

export default App;