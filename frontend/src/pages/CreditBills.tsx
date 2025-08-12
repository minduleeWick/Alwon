import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AdminLayout from '../layouts/AdminLayout';
import axios from 'axios';

interface Bill {
  id: string;
  invoiceNo: string;
  createdAt: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'closed';
  paymentMethod: 'credit' | 'cash';
}

const CreditBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/payments/history')
      .then(res => {
        const mapped = res.data
          .filter((item: any) => (item.paymentMethod || '').toLowerCase() === 'credit')
          .map((item: any, idx: number) => ({
            id: item._id || `${idx + 1}`,
            invoiceNo: item.invoiceNo || `INV${idx + 1}`,
            createdAt: item.paymentDate ? item.paymentDate.split('T')[0] : '',
            customerName: item.customerId?.customername || item.guestInfo?.name || 'Unknown',
            totalAmount: item.amount || 0,
            paidAmount: item.payment || 0,
            remainingAmount: item.deupayment || 0,
            status: (item.status || '').toLowerCase() === 'closed' || (item.deupayment || 0) <= 0 ? 'closed' : 'pending',
            paymentMethod: 'credit',
          }));
        setBills(mapped);
      })
      .catch(() => setBills([]));
  }, []);

  const handleOpen = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBill(null);
  };

  const handlePayment = () => {
    if (!selectedBill || !paymentAmount) return;

    const pay = parseFloat(paymentAmount);
    const updatedPaid = selectedBill.paidAmount + pay;
    const updatedRemaining = selectedBill.totalAmount - updatedPaid;
    const updatedStatus: 'pending' | 'closed' = updatedRemaining <= 0 ? 'closed' : 'pending';

    const updatedBills = bills.map((bill) =>
      bill.id === selectedBill.id
        ? {
            ...bill,
            paidAmount: updatedPaid,
            remainingAmount: updatedRemaining > 0 ? updatedRemaining : 0,
            status: updatedStatus,
          }
        : bill
    );

    setBills(updatedBills);
    handleClose();
  };

  const getCreditStatus = (bill: Bill) => {
    if (bill.remainingAmount <= 0) return 'Paid';
    if (bill.paidAmount === 0) return 'Unpaid';
    return 'Partially Paid';
  };

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
        <h2>Credit Bills </h2>
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
              <TableCell align="center"><b>Date</b></TableCell>
              <TableCell align="center"><b>Customer Name</b></TableCell>
              <TableCell align="center"><b>Total</b></TableCell>
              <TableCell align="center"><b>Paid</b></TableCell>
              <TableCell align="center"><b>Remaining</b></TableCell>
              <TableCell align="center"><b>Status</b></TableCell>
              <TableCell align="center"><b>Action</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell align="center">{bill.invoiceNo}</TableCell>
                  <TableCell align="center">{bill.createdAt}</TableCell>
                  <TableCell align="center">{bill.customerName}</TableCell>
                  <TableCell align="center">{bill.totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">{bill.paidAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">{bill.remainingAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">{getCreditStatus(bill)}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpen(bill)}
                      disabled={getCreditStatus(bill) === 'Paid'}
                    >
                      Pay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

      {/* Payment Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Pay Remaining Amount</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter payment amount"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            inputProps={{ min: 0 }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handlePayment}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>

    </AdminLayout>
  );
};

export default CreditBills;


