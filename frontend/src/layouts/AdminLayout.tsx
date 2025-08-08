import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <div>
      {/* TopBar fixed at top, full width */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 1
      }}>
        <TopBar />
      </div>
      {/* Sidebar fixed at left, above TopBar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 220,
        height: '100vh',
        zIndex: 2
      }}>
        <Sidebar />
      </div>
      {/* Main content, below TopBar and right of Sidebar */}
      <div style={{
        marginLeft: 220,
        marginTop: 60,
        padding: '20px'
      }}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;