import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from '../utils/axiosConfig';
import '../styles/theme.css';

const CurrentStockChart = () => {
  const [stockData, setStockData] = useState<Array<{ brand: string, bottleSize: string, quantity: number }>>([]);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState('');

  // Fetch stock data from backend
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://alwon.onrender.com/api/inventory/stock', {
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

  // Sort stock data by brand name
  const sortedStockData = [...stockData].sort((a, b) => a.brand.localeCompare(b.brand));

  // Filter stock data by selected brand (if any)
  const filteredStockData = brand ? sortedStockData.filter(item => item.brand === brand) : sortedStockData;

  // Transform data for chart
  const chartData = React.useMemo(() => {
    const bottleSizes = Array.from(new Set(sortedStockData.map(item => item.bottleSize))).sort();
    const brands = uniqueBrands;

    return bottleSizes.map(size => {
      const entry: { bottleSize: string; [key: string]: string | number } = { bottleSize: size };
      brands.forEach(brand => {
        const item = filteredStockData.find(d => d.brand === brand && d.bottleSize === size);
        entry[brand] = item ? item.quantity : 0;
      });
      return entry;
    });
  }, [filteredStockData]);

  // Dynamic colors for brands
  const colors = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2', '#0288d1', '#c2185b', '#689f38'];
  const brandColors = React.useMemo<Record<string, string>>(() => {
    return uniqueBrands.reduce((acc, brand, index) => ({
      ...acc,
      [brand]: colors[index % colors.length],
    }), {} as Record<string, string>);
  }, [uniqueBrands]);

  return (
    <Card sx={{ width: 'auto', height: 'auto', minHeight: 380 }} >
      <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2 }}>
        {/* Chart Area */}
        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Stock Distribution by Brand
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
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <XAxis dataKey="bottleSize" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              {uniqueBrands.map(brand => (
                <Bar
                  key={brand}
                  dataKey={brand}
                  fill={brandColors[brand]}
                  name={brand}
                  barSize={30}
                />
              ))}
            </BarChart>
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
            Brands
          </Typography>
          {uniqueBrands.map(brand => (
            <Box key={brand} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: brandColors[brand],
                  mr: 1,
                  borderRadius: '2px',
                }}
              />
              <Typography variant="body2">{brand}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CurrentStockChart;