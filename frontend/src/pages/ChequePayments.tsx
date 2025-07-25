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
  Select,
  MenuItem,
} from '@mui/material';
import AdminLayout from '../layouts/AdminLayout';

interface ChequePayment {
  id: string;
  invoiceNo: string;
  customerName: string;
  chequeNo: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'cleared' | 'bounced';
}

const initialData: ChequePayment[] = [
  {
    id: '1',
    invoiceNo: 'INV010',
    customerName: 'Nimal Perera',
    chequeNo: 'CHQ98765',
    dueDate: '2025-07-20',
    amount: 4500,
    status: 'pending',
  },
  {
    id: '2',
    invoiceNo: 'INV011',
    customerName: 'Sunil Silva',
    chequeNo: 'CHQ12345',
    dueDate: '2025-07-15',
    amount: 3000,
    status: 'cleared',
  },
  {
    id: '3',
    invoiceNo: 'INV012',
    customerName: 'Dilani Fernando',
    chequeNo: 'CHQ54321',
    dueDate: '2025-07-25',
    amount: 2000,
    status: 'pending',
  },
];

const ChequePayments = () => {
  const [cheques, setCheques] = useState<ChequePayment[]>(initialData);

  const handleStatusChange = (id: string, newStatus: ChequePayment['status']) => {
    const updated = cheques.map((cheque) =>
      cheque.id === id ? { ...cheque, status: newStatus } : cheque
    );
    setCheques(updated);
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
              <TableCell align="center"><b>Cheque No</b></TableCell>
              <TableCell align="center"><b>Due Date</b></TableCell>
              <TableCell align="center"><b>Amount</b></TableCell>
              <TableCell align="center"><b>Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cheques.map((row) => (
              <TableRow key={row.id}>
                <TableCell align="center">{row.invoiceNo}</TableCell>
                <TableCell align="center">{row.customerName}</TableCell>
                <TableCell align="center">{row.chequeNo}</TableCell>
                <TableCell align="center">{row.dueDate}</TableCell>
                <TableCell align="center">{row.amount.toFixed(2)}</TableCell>
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
    </div>
    </AdminLayout>
  );
};

export default ChequePayments;
