// src/pages/Customers.tsx
import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
  DialogContentText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Customer {
  name: string;
  phone: string;
  balance: number;
  createdAt: string;
}

const sampleCustomers: Customer[] = [
  {
    name: 'John Doe',
    phone: '0771234567',
    balance: 1500,
    createdAt: '2025-07-01',
  },
  {
    name: 'Jane Smith',
    phone: '0719876543',
    balance: 0,
    createdAt: '2025-07-05',
  },
];

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Customer>({
    name: '',
    phone: '',
    balance: 0,
    createdAt: new Date().toISOString().split('T')[0],
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);
  const handleDeleteClose = () => setDeleteOpen(false);


    const handleDeleteConfirm = (index: number) => {
    setCurrentEditIndex(index);
    setDeleteOpen(true);
  };

    const handleDelete = () => {
    if (currentEditIndex !== null) {
      const updated = [...customers];
      updated.splice(currentEditIndex, 1);
      setCustomers(updated);
      setCurrentEditIndex(null);
    }
    handleDeleteClose();
  };
  const handleAddCustomer = () => {
    setCustomers([...customers, formData]);
    handleClose();
    resetForm();
  };

  const handleEdit = (index: number) => {
    setCurrentEditIndex(index);
    setFormData(customers[index]);
    setEditOpen(true);
  };

  const handleUpdateCustomer = () => {
    if (currentEditIndex !== null) {
      const updated = [...customers];
      updated[currentEditIndex] = formData;
      setCustomers(updated);
      setCurrentEditIndex(null);
    }
    handleEditClose();
    resetForm();
  };


  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <h2>Customer Management</h2>
          <Button variant="contained" onClick={handleOpen}>
            Add Customer
          </Button>
        </div>

        <Paper sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Customer Name</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Remaining Balance (Rs)</strong></TableCell>
                  <TableCell><strong>Created At</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>Rs. {customer.balance.toFixed(2)}</TableCell>
                      <TableCell>{customer.createdAt}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(index)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteConfirm(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={customers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Paper>

        {/* Add Dialog */}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 300 }}>
            <TextField label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <TextField label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <TextField label="Balance" type="number" value={formData.balance} onChange={e => setFormData({ ...formData, balance: +e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddCustomer} variant="contained">Save</Button>
            <Button onClick={handleClose} color="secondary">Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onClose={handleEditClose}>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 300 }}>
            <TextField label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <TextField label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <TextField label="Balance" type="number" value={formData.balance} onChange={e => setFormData({ ...formData, balance: +e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUpdateCustomer} variant="contained">Update</Button>
            <Button onClick={handleEditClose} color="secondary">Cancel</Button>
          </DialogActions>
        </Dialog>

                {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onClose={handleDeleteClose}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this record?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteClose} color="primary">Cancel</Button>
            <Button onClick={handleDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Customers;
