import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const role = localStorage.getItem('role'); // 'admin' or 'user'

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Company Logo" />
      </div>
      <div className="sidebar-menu-container">
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
             {/* <li className={location.pathname === '/reports' ? 'active' : ''}>
              <Link to="/reports">
                <BarChartIcon className="icon" />
                <span>Reports</span>
              </Link>
            </li> */}
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
            <li className={location.pathname===('/bill-history') ? 'active' : ''}>
              <div className="sidebar-submenu">
                <Link to="/bill-history">
                  <HistoryIcon className="icon" /> Bill History
                </Link>
                <ul className="nested-submenu">
                  <li className={location.pathname === '/bill-history/credit' ? 'active' : ''}>
                    <Link to="/bill-history/credit">Credit Bills</Link>
                  </li>
                </ul>
                <ul className="nested-submenu">
                  <li className={location.pathname === '/bill-history/cheques' ? 'active' : ''}>
                    <Link to="/bill-history/cheques">Cheque Payments</Link>
                  </li>
                </ul>
              </div>
            </li>

      </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
