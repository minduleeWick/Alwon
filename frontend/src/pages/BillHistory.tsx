// src/pages/BillHistory.tsx
import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Paper, IconButton, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '19L'];

interface Bottle {
  type: string;
  quantity: number;
}

interface Bill {
  invoiceNo: string;
  date: string;
  customerName: string;
  bottles: Bottle[];
  total: number;
  paymentType: string;
  status: string;
}

const sampleBills: Bill[] = [
  {
    invoiceNo: 'INV001',
    date: '2025-07-10',
    customerName: 'John Doe',
    bottles: [
      { type: '500ml', quantity: 5 },
      { type: '1L', quantity: 3 }
    ],
    total: 1000,
    paymentType: 'Cash',
    status: 'Paid'
  },
  {
    invoiceNo: 'INV002',
    date: '2025-07-12',
    customerName: 'Jane Smith',
    bottles: [
      { type: '5L', quantity: 2 },
      { type: '19L', quantity: 1 }
    ],
    total: 2200,
    paymentType: 'Credit',
    status: 'Unpaid'
  }
];

const BillHistory: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(sampleBills);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedBillIndex, setSelectedBillIndex] = useState<number | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: number }>({});

  const handleStatusChange = (index: number, newStatus: string) => {
    const updated = [...bills];
    updated[index].status = newStatus;
    setBills(updated);
  };

  const openReturnDialog = (index: number) => {
    setSelectedBillIndex(index);
    const bottleMap = Object.fromEntries(bills[index].bottles.map(b => [b.type, 0]));
    setReturnQuantities(bottleMap);
    setReturnDialogOpen(true);
  };

  const handleReturnSubmit = () => {
    if (selectedBillIndex === null) return;

    const updated = [...bills];
    const bill = updated[selectedBillIndex];

    bill.bottles = bill.bottles.map(bottle => {
      const returnedQty = returnQuantities[bottle.type] || 0;
      const newQty = Math.max(bottle.quantity - returnedQty, 0);
      return { ...bottle, quantity: newQty };
    });

    bill.total = bill.bottles.reduce((sum, b) => sum + b.quantity * 100, 0); // assuming flat price for example

    setBills(updated);
    setReturnDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="bill-history-page">
        <h2>Bill History</h2>

        <Paper sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center"><strong>Invoice No</strong></TableCell>
                  <TableCell align="center"><strong>Date</strong></TableCell>
                  <TableCell align="center"><strong>Customer Name</strong></TableCell>
                  <TableCell align="center" colSpan={bottleTypes.length}><strong>Bottle Order Details</strong></TableCell>
                  <TableCell align="center"><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>Payment Type</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  {bottleTypes.map(type => (
                    <TableCell key={type} align="center"><strong>{type}</strong></TableCell>
                  ))}
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill, index) => {
                  const bottleMap = Object.fromEntries(bill.bottles.map(b => [b.type, b.quantity]));
                  return (
                    <TableRow key={index}>
                      <TableCell align="center">{bill.invoiceNo}</TableCell>
                      <TableCell align="center">{bill.date}</TableCell>
                      <TableCell align="center">{bill.customerName}</TableCell>
                      {bottleTypes.map(type => (
                        <TableCell key={type} align="center">{bottleMap[type] || 0}</TableCell>
                      ))}
                      <TableCell align="center">Rs. {bill.total.toFixed(2)}</TableCell>
                      <TableCell align="center">{bill.paymentType}</TableCell>
                      <TableCell align="center">
                        <Select
                          value={bill.status}
                          onChange={(e) => handleStatusChange(index + page * rowsPerPage, e.target.value)}
                          size="small"
                        >
                          <MenuItem value="Paid">Paid</MenuItem>
                          <MenuItem value="Unpaid">Unpaid</MenuItem>
                          <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                        </Select>
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
            {bottleTypes.map(type => (
              <TextField
                key={type}
                label={`Return Qty (${type})`}
                type="number"
                value={returnQuantities[type] || ''}
                onChange={(e) => setReturnQuantities({
                  ...returnQuantities,
                  [type]: Math.max(Number(e.target.value), 0)
                })}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReturnSubmit} variant="contained">Submit</Button>
            <Button onClick={() => setReturnDialogOpen(false)} color="secondary">Cancel</Button>
          </DialogActions>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default BillHistory;
