import React from 'react';
import { Box, Typography } from '@mui/material';

const Pageloader: React.FC = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      bgcolor: 'rgba(255,255,255,0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}
  >
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: '#00B4D8',
          animation: 'bounce 1s infinite',
        }}
      />
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: '#F77F00',
          animation: 'bounce 1s infinite 0.2s',
        }}
      />
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: '#43AA8B',
          animation: 'bounce 1s infinite 0.4s',
        }}
      />
    </Box>
    <Typography sx={{ mt: 2 }} variant="h6" color="text.secondary">
      Loading...
    </Typography>
    <style>
      {`
      @keyframes bounce {
        0%, 100% { transform: translateY(0);}
        50% { transform: translateY(-15px);}
      }
      `}
    </style>
  </Box>
);

export default Pageloader;