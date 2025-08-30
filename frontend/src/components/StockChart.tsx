import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from '../utils/axiosConfig';
import '../styles/theme.css';

const StockTrendChart = () => {
  const [stockData, setStockData] = useState<Array<{ date: string, brand: string, bottles: Array<{ itemCode: string, availablequantity: number }> }>>([]);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState('');

  // Fetch inventory data from backend
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://alwon.onrender.com/api/inventory', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStockData(response.data);
        setError('');
      } catch (err) {
        setError('Error fetching stock data');
        console.error('Error fetching stock data:', err);
        setStockData([]);
      }
    };

    fetchStockData();
  }, []);

  // Get unique brands for brand selector
  const uniqueBrands = React.useMemo(() => {
    const brands = new Set(stockData.map(item => item.brand));
    return Array.from(brands).sort();
  }, [stockData]);

  const bottleSizes = ['500ml', '1L', '1.5L', '5L', '19L'];

  // Transform data for chart
  const chartData = React.useMemo(() => {
    // Get unique dates
    const dates = Array.from(new Set(stockData.map(item => new Date(item.date).toISOString().split('T')[0]))).sort();

    // Initialize chart data with all dates and bottle sizes
    const data = dates.map(date => {
      const entry: { date: string; [key: string]: string | number } = { date };

      // Initialize all possible keys with 0
      if (brand) {
        bottleSizes.forEach(size => {
          entry[`${brand}_${size}`] = 0;
        });
      } else {
        bottleSizes.forEach(size => {
          entry[size] = 0;
        });
      }

      return entry;
    });

    // Aggregate quantities by date and bottle size
    stockData.forEach(item => {
      const date = new Date(item.date).toISOString().split('T')[0];
      const entry = data.find(d => d.date === date);

      if (entry && (!brand || item.brand === brand)) {
        item.bottles.forEach(bottle => {
          if (bottleSizes.includes(bottle.itemCode)) {
            const key = brand ? `${item.brand}_${bottle.itemCode}` : bottle.itemCode;
            entry[key] = Number(entry[key] || 0) + bottle.availablequantity;
          }
        });
      }
    });

    return data;
  }, [stockData, brand]);

  // Dynamic colors for lines
  const colors = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2', '#0288d1', '#c2185b', '#689f38'];
  const lineColors: { [key: string]: string } = React.useMemo(() => {
    if (brand) {
      return bottleSizes.reduce((acc, size, index) => ({
        ...acc,
        [`${brand}_${size}`]: colors[index % colors.length],
      }), {});
    }
    return bottleSizes.reduce((acc, size, index) => ({
      ...acc,
      [size]: colors[index % colors.length],
    }), {});
  }, [brand]);

  // Keys for lines
  const lineKeys = brand ? bottleSizes.map(size => `${brand}_${size}`) : bottleSizes;

  return (
    <Card sx={{ width: '100%', height: 'auto', minHeight: 380 }} >
      <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2 }}>
        {/* Chart Area */}
        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Stock Trends by Brand
          </Typography>
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          {chartData.length === 0 && !error && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              No stock data available
            </Typography>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              {lineKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={lineColors[key] || colors[index % colors.length]}
                  strokeWidth={3}
                  name={brand ? key.split('_')[1] : key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
        {/* Custom Legend (Colors on the Side) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: 6 }}>
          {/* Brand Selector */}
          <div className="bottle-row" style={{ marginBottom: '1rem' }}>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Brands</option>
              {uniqueBrands.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <Typography variant="subtitle2" gutterBottom>
            {brand ? `${brand} Bottle Sizes` : 'Bottle Sizes'}
          </Typography>
          {lineKeys.map((key, index) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: lineColors[key] || colors[index % colors.length],
                  mr: 1,
                  borderRadius: '2px',
                }}
              />
              <Typography variant="body2">
                {brand ? key.split('_')[1] : key}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockTrendChart;