import React, { useState } from 'react';
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

const sampleBills: Bill[] = [
  {
    id: '1',
    invoiceNo: 'INV001',
    createdAt: '2025-07-10',
    customerName: 'John Doe',
    totalAmount: 5000,
    paidAmount: 2000,
    remainingAmount: 3000,
    status: 'pending',
    paymentMethod: 'credit',
  },
  {
    id: '2',
    invoiceNo: 'INV002',
    createdAt: '2025-07-11',
    customerName: 'Jane Smith',
    totalAmount: 3000,
    paidAmount: 1000,
    remainingAmount: 2000,
    status: 'pending',
    paymentMethod: 'credit',
  },
  {
    id: '3',
    invoiceNo: 'INV003',
    createdAt: '2025-07-12',
    customerName: 'Alice Johnson',
    totalAmount: 2500,
    paidAmount: 2500,
    remainingAmount: 0,
    status: 'closed',
    paymentMethod: 'credit',
  },
];

const CreditBills = () => {
  const [bills, setBills] = useState<Bill[]>(sampleBills);
  const [open, setOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

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

  return (
    <AdminLayout>
    <div style={{ padding: 20 }}>
      <Typography variant="h5" gutterBottom>
        <b>Credit Bills</b>
      </Typography>

      <TableContainer component={Paper}>
        <Table>
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
            {bills
              .filter((bill) => bill.paymentMethod === 'credit' && bill.status !== 'closed')
              .map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell align="center">{bill.invoiceNo}</TableCell>
                  <TableCell align="center">{bill.createdAt}</TableCell>
                  <TableCell align="center">{bill.customerName}</TableCell>
                  <TableCell align="center">{bill.totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">{bill.paidAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">{bill.remainingAmount.toFixed(2)}</TableCell>
                  <TableCell align="center">{bill.status}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpen(bill)}
                      disabled={bill.status === 'closed'}
                    >
                      Pay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

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
