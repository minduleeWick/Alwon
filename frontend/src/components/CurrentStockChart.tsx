import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const todayStock = [
  { type: '500ml', quantity: 120 },
  { type: '1L', quantity: 80 },
  { type: '1.5L', quantity: 60 },
  { type: '5L', quantity: 30 },
  { type: '19L', quantity: 10 }
];

const CurrentStockChart: React.FC = () => {
  return (
    <Card sx={{ width: '100%', height: 380 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stock Distribution (Today)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={todayStock}>
            <XAxis dataKey="type" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CurrentStockChart;
