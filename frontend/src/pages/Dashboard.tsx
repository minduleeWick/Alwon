import React, { useState, useEffect } from 'react';
import '../styles/theme.css';
import AdminLayout from '../layouts/AdminLayout';
import DashboardCard from '../components/DashboardCard';
import StockChart from '../components/StockChart';
import CurrentStockChart from '../components/CurrentStockChart';
import Pageloader from '../pages/Pageloader';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading, replace with actual fetch
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Pageloader />;

  return (
    <AdminLayout>
      <h2>Admin Dashboard</h2>
      <div className="card-container">
        <DashboardCard title="Inventory" icon="/icons/inventory.png" route="/inventory" />
        <DashboardCard title="Billing" icon="/icons/billing.png" route="/billing" />
        <DashboardCard title="Reports" icon="/icons/reports.png" route="/reports" />
      </div>
      {/* Charts Section */}
      <div style={{ 
        marginTop: '2rem', 
        display: 'flex', 
        gap: '1.5rem', 
        flexWrap: 'wrap' 
      }}>
        <div style={{ flex: 1, minWidth: '400px' }}>
          <StockChart />
        </div>
        <div style={{ flex: 1, minWidth: '400px' }}>
          <CurrentStockChart />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;