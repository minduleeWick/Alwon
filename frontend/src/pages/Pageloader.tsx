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
      {/* Water Drop 1 */}
      <Box
        sx={{
          position: 'relative',
          width: 20,
          height: 28,
          clipPath: 'polygon(50% 0%, 100% 60%, 75% 100%, 25% 100%, 0% 60%)',
          background: 'linear-gradient(180deg, #003cffff 60%, #292525ff 100%)',
          animation: 'bounce 1s infinite',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 8,
            width: 6,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            opacity: 0.7,
            filter: 'blur(1px)',
          }}
        />
      </Box>
      {/* Water Drop 2 */}
      <Box
        sx={{
          position: 'relative',
          width:20,
          height: 28,
          clipPath: 'polygon(50% 0%, 100% 60%, 75% 100%, 25% 100%, 0% 60%)',
          background: 'linear-gradient(180deg, #006effff 60%, #292525ff 100%)',
          animation: 'bounce 1s infinite 0.2s',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 8,
            width: 6,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            opacity: 0.7,
            filter: 'blur(1px)',
          }}
        />
      </Box>
      {/* Water Drop 3 */}
      <Box
        sx={{
          position: 'relative',
          width: 20,
          height: 28,
          clipPath: 'polygon(50% 0%, 100% 60%, 75% 100%, 25% 100%, 0% 60%)',
          background: 'linear-gradient(180deg, #00a2ffff 60%, #292525ff 100%)',
          animation: 'bounce 1s infinite 0.4s',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 8,
            width: 6,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            opacity: 0.7,
            filter: 'blur(1px)',
          }}
        />
      </Box>
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