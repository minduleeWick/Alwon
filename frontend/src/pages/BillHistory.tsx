import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Paper, IconButton, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '19L'];

interface Bottle {
  type: string;
  quantity: number;
  price: number;
  brand?: string; // Added brand field
}

interface Bill {
  _id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  bottles: Bottle[];
  total: number;
  paymentType: string;
  status: string;
  paidAmount?: number;
  remainingAmount?: number;
}

const BillHistory: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedBillIndex, setSelectedBillIndex] = useState<number | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: number }>({});
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchBills = async () => {
    try {
      const response = await axios.get('https://alwon.onrender.com/api/payments/history');
      // Map backend data to Bill[]
      const mapped = response.data.map((item: any) => ({
        _id: item._id,
        invoiceNo: item.invoiceNo || '',
        date: item.paymentDate ? item.paymentDate.split('T')[0] : '',
        customerName: item.customerId?.customername || item.guestInfo?.name || 'Unknown',
        bottles: item.bottles || [],
        total: item.amount || 0,
        paymentType: item.paymentMethod || '',
        status: item.status || '',
        paidAmount: item.payment ?? 0,
        remainingAmount: item.deupayment ?? 0,
      }));
      setBills(mapped);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load bill history',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleStatusChange = async (index: number, newStatus: string) => {
    const bill = bills[index];
    if (!bill._id) return;
    
    try {
      // Update status in the database
      await axios.put(`https://alwon.onrender.com/api/payments/update/${bill._id}`, {
        status: newStatus
      });
      
      // Create a new array to ensure React detects the state change
      const updated = [...bills];
      updated[index] = {
        ...updated[index],
        status: newStatus
      };
      setBills(updated);
      
      setSnackbar({
        open: true,
        message: 'Status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error'
      });
    }
  };

  const openReturnDialog = (index: number) => {
    setSelectedBillIndex(index);
    const bottleMap = Object.fromEntries(bills[index].bottles.map(b => [b.type, 0]));
    setReturnQuantities(bottleMap);
    setReturnDialogOpen(true);
  };

  const handleReturnSubmit = async () => {
    if (selectedBillIndex === null) return;
    
    const bill = bills[selectedBillIndex];
    if (!bill._id) return;

    // Create an array of returned bottles with valid quantities
    const returnedBottles = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([type, quantity]) => ({ type, quantity }));
    
    if (returnedBottles.length === 0) {
      setReturnDialogOpen(false);
      return;
    }
    
    try {
      // Send return data to the server
      await axios.put(`https://alwon.onrender.com/api/payments/update/${bill._id}`, {
        returnedBottles
      });
      
      // Refresh bills to get updated data
      await fetchBills();
      
      setSnackbar({
        open: true,
        message: 'Returns processed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error processing returns:', error);
      setSnackbar({
        open: true,
        message: 'Failed to process returns',
        severity: 'error'
      });
    }
    
    setReturnDialogOpen(false);
  };

  const getStatus = (bill: Bill) => {
    const type = bill.paymentType?.toLowerCase();
    if (type === 'credit') {
      const paid = bill.paidAmount ?? 0;
      const due = bill.remainingAmount ?? (bill.total - paid);
      if (due <= 0) return 'paid';
      if (paid === 0) return 'unpaid';
      return 'partially paid';
    } else if (type === 'cheque') {
      // Default to backend status or pending
      return bill.status?.toLowerCase() || 'pending';
    } else if (type === 'cash') {
      return 'paid';
    }
    return bill.status?.toLowerCase() || '';
  };

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
        <h2>Bill History</h2>
        </div>

        <Paper sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center"><strong>Invoice No</strong></TableCell>
                  <TableCell align="center"><strong>Date</strong></TableCell>
                  <TableCell align="center"><strong>Customer Name</strong></TableCell>
                  <TableCell align="center"><strong>Brand</strong></TableCell>
                  <TableCell align="center" colSpan={bottleTypes.length}><strong>Bottle Order Details</strong></TableCell>
                  <TableCell align="center"><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>Remaining Balance</strong></TableCell>
                  <TableCell align="center"><strong>Payment Type</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  {bottleTypes.map(type => (
                    <TableCell key={type} align="center"><strong>{type}</strong></TableCell>
                  ))}
                  <TableCell />
                  <TableCell /> {/* placeholder for Remaining Balance */}
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill, index) => {
                  const bottleMap = Object.fromEntries(bill.bottles.map(b => [b.type, b.quantity]));
                  const computedStatus = getStatus(bill);
                  const type = bill.paymentType?.toLowerCase();
                  // Get the brand from the first bottle or use the main brand
                  const brand = bill.bottles && bill.bottles.length > 0 ? bill.bottles[0].brand || '' : '';
                  const remaining = bill.remainingAmount ?? (bill.total - (bill.paidAmount ?? 0));
                  return (
                    <TableRow key={index}>
                      <TableCell align="center">{bill.invoiceNo}</TableCell>
                      <TableCell align="center">{bill.date}</TableCell>
                      <TableCell align="center">{bill.customerName}</TableCell>
                      <TableCell align="center">{brand}</TableCell>
                      {bottleTypes.map(type => (
                        <TableCell key={type} align="center">{bottleMap[type] || 0}</TableCell>
                      ))}
                      <TableCell align="center">Rs. {bill.total.toFixed(2)}</TableCell>
                      <TableCell align="center">Rs. {remaining.toFixed(2)}</TableCell>
                      <TableCell align="center">{bill.paymentType}</TableCell>
                      <TableCell align="center">
                        {type === 'credit' ? (
                          // Changed: show status text for credit (no Select)
                          computedStatus.charAt(0).toUpperCase() + computedStatus.slice(1)
                        ) : type === 'cheque' ? (
                          <Select
                            value={bill.status || computedStatus}
                            onChange={(e) => handleStatusChange(index + page * rowsPerPage, e.target.value)}
                            size="small"
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="cleared">Cleared</MenuItem>
                            <MenuItem value="bounced">Bounced</MenuItem>
                          </Select>
                        ) : type === 'cash' ? (
                          'Paid'
                        ) : (
                          computedStatus.charAt(0).toUpperCase() + computedStatus.slice(1)
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => openReturnDialog(index + page * rowsPerPage)}>
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10]}
            component="div"
            count={bills.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Returns Dialog */}
        <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Enter Returns</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedBillIndex !== null && bills[selectedBillIndex]?.bottles.map(bottle => (
              <TextField
                key={bottle.type}
                label={`Return Qty (${bottle.type})`}
                type="number"
                value={returnQuantities[bottle.type] || ''}
                onChange={(e) => setReturnQuantities({
                  ...returnQuantities,
                  [bottle.type]: Math.min(
                    Math.max(Number(e.target.value), 0), 
                    bottle.quantity
                  )
                })}
                inputProps={{ 
                  min: 0, 
                  max: bottle.quantity 
                }}
                helperText={`Available: ${bottle.quantity}`}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReturnSubmit} variant="contained">Submit</Button>
            <Button onClick={() => setReturnDialogOpen(false)} color="secondary">Cancel</Button>
          </DialogActions>
        </Dialog>

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

export default BillHistory;