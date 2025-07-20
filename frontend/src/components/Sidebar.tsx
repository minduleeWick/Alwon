import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/People';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const role = localStorage.getItem('role'); // 'admin' or 'user'

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Company Logo" />
      </div>
      <ul className="sidebar-menu">
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard">
            <DashboardIcon className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>
        <li className={location.pathname === '/inventory' ? 'active' : ''}>
          <Link to="/inventory">
            <InventoryIcon className="icon" />
            <span>Inventory</span>
          </Link>
        </li>
        <li className={location.pathname === '/billing' ? 'active' : ''}>
          <Link to="/billing">
            <ReceiptIcon className="icon" />
            <span>Billing</span>
          </Link>
        </li>
        {/* {role === 'admin' && (
          <>
            <li className={location.pathname === '/reports' ? 'active' : ''}>
              <Link to="/reports">
                <BarChartIcon className="icon" />
                <span>Reports</span>
              </Link>
            </li>
            <li className={location.pathname === '/users' ? 'active' : ''}>
              <Link to="/users">
                <PeopleAltIcon className="icon" />
                <span>Users</span>
              </Link>
            </li>
          </>
        )} */}
                    <li className={location.pathname === '/reports' ? 'active' : ''}>
              <Link to="/reports">
                <BarChartIcon className="icon" />
                <span>Reports</span>
              </Link>
            </li>
            <li className={location.pathname === '/users' ? 'active' : ''}>
              <Link to="/users">
                <PeopleAltIcon className="icon" />
                <span>Users</span>
              </Link>
            </li>
            <li className={location.pathname === '/customer' ? 'active' : ''}>
              <Link to="/customer">
                <PeopleAltIcon className="icon" />
                <span>Customer</span>
              </Link>
            </li>
              <li className={location.pathname === '/bill-history' ? 'active' : ''}>
              <Link to="/bill-history">
                <ReceiptIcon className="icon" />
                <span>Bill History</span>
              </Link>
            </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
