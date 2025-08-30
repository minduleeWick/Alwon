import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import { useTheme, useMediaQuery } from '@mui/material';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const handleToggle = () => setOpen(!open);

  // Styles: persistent on desktop, overlay on mobile/tablet
  const navStyle: React.CSSProperties = isDesktop
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 220,
        overflowY: 'auto',
        zIndex: 1200,
      }
    : {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 260,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 240ms ease-in-out',
        background: '#fff',
        zIndex: 1400, // ensure it overlays the TopBar on small screens
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={handleToggle}
        aria-label="Toggle sidebar"
        style={{ zIndex: 1500 }}
      >
        ☰
      </button>
      <nav className={`sidebar${open ? ' open' : ''}`} style={navStyle} aria-hidden={!isDesktop && !open}>
        <div className="sidebar-scroll-container" style={{ height: '100%', overflowY: 'auto' }}>
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
                <span>Invoice</span>
              </Link>
            </li>
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
    </>
  );
};

export default Sidebar;