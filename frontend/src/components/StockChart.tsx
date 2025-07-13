// components/StockChart.tsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BottleStock {
  date: string;
  '500ml': number;
  '1L': number;
  '1.5L': number;
  '5L': number;
  '19L': number;
}

const sampleData: BottleStock[] = [
  { date: '2025-07-01', '500ml': 100, '1L': 80, '1.5L': 60, '5L': 40, '19L': 10 },
  { date: '2025-07-02', '500ml': 120, '1L': 75, '1.5L': 50, '5L': 35, '19L': 15 },
  { date: '2025-07-03', '500ml': 90,  '1L': 65, '1.5L': 55, '5L': 45, '19L': 20 },
];

const StockChart: React.FC = () => {
  return (
    <Card style={{ width: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Real-Time Stock Overview
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sampleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="500ml" stroke="#8884d8" />
            <Line type="monotone" dataKey="1L" stroke="#82ca9d" />
            <Line type="monotone" dataKey="1.5L" stroke="#ffc658" />
            <Line type="monotone" dataKey="5L" stroke="#ff8042" />
            <Line type="monotone" dataKey="19L" stroke="#0088FE" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StockChart;
