// ---- frontend/src/components/Sidebar.tsx ----
import React from 'react';
import '../styles/sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Company Logo" />
        
      </div>
      <ul>
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard">
            <DashboardIcon className="icon" /> Dashboard
          </Link>
        </li>
        <li className={location.pathname === '/inventory' ? 'active' : ''}>
          <Link to="/inventory">
            <InventoryIcon className="icon" /> Inventory
          </Link>
        </li>
        <li className={location.pathname === '/billing' ? 'active' : ''}>
          <Link to="/billing">
            <ReceiptIcon className="icon" /> Billing
          </Link>
        </li>
        <li className={location.pathname === '/reports' ? 'active' : ''}>
          <Link to="/reports">
            <BarChartIcon className="icon" /> Reports
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
