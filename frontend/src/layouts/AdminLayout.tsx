// ---- frontend/src/layouts/AdminLayout.tsx ----
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useTheme, useMediaQuery } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <div style={{ display: 'flex', overflowX: 'hidden' }}>
      <Sidebar />
      <div style={{ marginLeft: isDesktop ? 220 : 0, flex: 1, minWidth: 0 }}>
        <TopBar />
        <main style={{ padding: '20px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
