import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/theme.css';

type Props = {
  title: string;
  icon: string;
  route: string;
};

const DashboardCard: React.FC<Props> = ({ title, icon, route }) => {
  const navigate = useNavigate();
  return (
    <div className="card" onClick={() => navigate(route)}>
      <img src={icon} alt={`${title} icon`} className="card-icon" />
      <h3>{title}</h3>
    </div>
  );
};

export default DashboardCard;