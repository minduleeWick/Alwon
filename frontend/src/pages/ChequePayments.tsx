import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import AdminLayout from '../layouts/AdminLayout';
import axios from 'axios';

interface ChequePayment {
  id: string;
  invoiceNo: string;
  customerName: string;
  brand: string;  // Add brand to the interface
  chequeNo: string;
  dueDate: string;
  amount: number;
  remainingAmount: number; // <-- new field
  status: 'pending' | 'cleared' | 'bounced';
}

const ChequePayments = () => {
  const [cheques, setCheques] = useState<ChequePayment[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchCheques = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payments/history');
      const mapped = res.data
        .filter((item: any) => (item.paymentMethod || '').toLowerCase() === 'cheque')
        .map((item: any, idx: number) => ({
          id: item._id || `${idx + 1}`,
          invoiceNo: item.invoiceNo || `INV${idx + 1}`,
          customerName: item.customerId?.customername || item.guestInfo?.name || 'Unknown',
          // Get brand from bottles array or use the main brand
          brand: item.bottles && item.bottles.length > 0 ? 
                 item.bottles[0].brand || item.brand || 'Unknown' : 
                 item.brand || 'Unknown',
          chequeNo: item.chequeNo || '',
          dueDate: item.chequeDate ? item.chequeDate.split('T')[0] : '',
          amount: item.amount || 0,
          remainingAmount: (typeof item.remainingAmount === 'number') 
                            ? item.remainingAmount 
                            : ((item.amount || 0) - (item.payment || 0)), // fallback calculation
          status: (item.status || '').toLowerCase() as ChequePayment['status'],
        }));
      setCheques(mapped);
    } catch (error) {
      console.error('Error fetching cheque payments:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load cheque payments',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchCheques();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ChequePayment['status']) => {
    try {
      // Update status in the database
      await axios.put(`http://localhost:5000/api/payments/update/${id}`, {
        status: newStatus
      });
      
      setSnackbar({
        open: true,
        message: 'Cheque status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating cheque status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update cheque status',
        severity: 'error'
      });
    } finally {
      // Always refresh the list after the action
      fetchCheques();
    }
  };

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
        <h2>Cheque Payment History</h2>
      </div>

        <Paper sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="inventory table" sx={{
              '& th, & td': {
                borderRight: '1px solid #ccc',
              },
              '& th:last-child, & td:last-child': {
                borderRight: 'none',
              }
            }}>
          <TableHead>
            <TableRow style={{ backgroundColor: '#f0f0f0' }}>
              <TableCell align="center"><b>Invoice No</b></TableCell>
              <TableCell align="center"><b>Customer Name</b></TableCell>
              <TableCell align="center"><b>Brand</b></TableCell>
              <TableCell align="center"><b>Cheque No</b></TableCell>
              <TableCell align="center"><b>Due Date</b></TableCell>
              <TableCell align="center"><b>Amount</b></TableCell>
              <TableCell align="center"><b>Remaining</b></TableCell> {/* new column */}
              <TableCell align="center"><b>Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cheques.map((row) => (
              <TableRow key={row.id}>
                <TableCell align="center">{row.invoiceNo}</TableCell>
                <TableCell align="center">{row.customerName}</TableCell>
                <TableCell align="center">{row.brand}</TableCell>
                <TableCell align="center">{row.chequeNo}</TableCell>
                <TableCell align="center">{row.dueDate}</TableCell>
                <TableCell align="center">{row.amount.toFixed(2)}</TableCell>
                <TableCell align="center">{row.remainingAmount.toFixed(2)}</TableCell> {/* display */}
                <TableCell align="center">
                  <Select
                    value={row.status}
                    onChange={(e) =>
                      handleStatusChange(row.id, e.target.value as ChequePayment['status'])
                    }
                    size="small"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="cleared">Cleared</MenuItem>
                    <MenuItem value="bounced">Bounced</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
    </AdminLayout>
  );
};

export default ChequePayments;

