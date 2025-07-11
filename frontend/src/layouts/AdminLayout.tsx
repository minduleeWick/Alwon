// ---- frontend/src/layouts/AdminLayout.tsx ----
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: 230, flex: 1 }}>
        <TopBar />
        <main style={{ padding: '20px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
