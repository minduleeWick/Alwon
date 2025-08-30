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
import axios from 'axios';

const apiBase = 'https://alwon.onrender.com/api/customers';
const paymentsApi = 'https://alwon.onrender.com/api/payments/history'; // added

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '20L'];

interface Customer {
  name: any;
  _id?: string;
  customername?: string;
  phone: string;
  remainingAmount?: number;
  priceRates?: { bottleType: string; price: number }[];
  bottlePrices: { [key: string]: number };
}

// Helper to convert backend priceRates to frontend bottlePrices
const priceRatesToBottlePrices = (priceRates: { bottleType: string; price: number }[]) => {
  const bottlePrices: { [key: string]: number } = {};
  bottleTypes.forEach(type => {
    const found = priceRates.find(rate => rate.bottleType === type);
    bottlePrices[type] = found ? found.price : 0;
  });
  return bottlePrices;
};

// Helper to convert frontend bottlePrices to backend priceRates
const bottlePricesToPriceRates = (bottlePrices: { [key: string]: number }) =>
  bottleTypes.map(type => ({
    bottleType: type,
    price: bottlePrices[type] || 0,
  }));

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Customer>({
    name: '',
    phone: '',
    bottlePrices: Object.fromEntries(bottleTypes.map(type => [type, 0])),
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

  const handleDelete = async () => {
    if (currentEditIndex !== null) {
      const customer = customers[currentEditIndex];
      try {
        await axios.delete(`${apiBase}/${customer._id}`);
        const updated = [...customers];
        updated.splice(currentEditIndex, 1);
        setCustomers(updated);
        setCurrentEditIndex(null);
        handleDeleteClose();
      } catch (err) {
        // handle error
      }
    }
  };

  // Helper to compute total remaining for a customer by summing payment.remainingAmount (fallback to deupayment)
  const computeRemainingFor = async (customerId?: string) => {
    if (!customerId) return 0;
    try {
      const res = await axios.get(paymentsApi, { params: { customerId } });
      const payments = Array.isArray(res.data) ? res.data : [];
      return payments.reduce((sum: number, p: any) => sum + (Number(p.remainingAmount ?? p.deupayment ?? 0) || 0), 0);
    } catch (err) {
      return 0;
    }
  };

  // Fetch customers from backend and enrich with computed remaining balance
  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(apiBase);
        const raw = res.data || [];
        const mapped = raw.map((c: any) => ({
          ...c,
          name: c.customername,
          remainingAmount: c.remainingAmount || 0,
          bottlePrices: priceRatesToBottlePrices(c.priceRates || []),
          phone: c.phone || '',
        }));
        // compute remaining balances in parallel
        const enriched = await Promise.all(mapped.map(async (c: any) => {
          const remaining = await computeRemainingFor(c._id);
          return { ...c, remainingAmount: remaining };
        }));
        setCustomers(enriched);
      } catch (err) {
        // handle error
      }
    };
    fetchCustomers();
  }, []);

  // Add customer
  const handleAddCustomer = async () => {
    const payload = {
      customername: formData.name,
      phone: formData.phone,
      priceRates: bottlePricesToPriceRates(formData.bottlePrices),
      type: 'regular'
    };
    try {
      const res = await axios.post(`${apiBase}/add`, payload);
      // compute remaining from payments API (in case there are payment records)
      const remaining = await computeRemainingFor(res.data._id);
      setCustomers([
        ...customers,
        {
          ...res.data,
          name: res.data.customername,
          remainingAmount: remaining,
          bottlePrices: priceRatesToBottlePrices(res.data.priceRates || []),
          phone: res.data.phone || ''
        },
      ]);
      handleClose();
      resetForm();
    } catch (err) {
      // handle error
    }
  };

  // Edit customer
  const handleUpdateCustomer = async () => {
    if (currentEditIndex !== null) {
      const customer = customers[currentEditIndex];
      const payload = {
        customername: formData.name,
        phone: formData.phone,
        priceRates: bottlePricesToPriceRates(formData.bottlePrices),
        type: 'regular'
      };
      try {
        const res = await axios.put(`${apiBase}/${customer._id}`, payload);
        // recompute remaining after update
        const remaining = await computeRemainingFor(res.data._id);
        const updated = [...customers];
        updated[currentEditIndex] = {
          ...res.data,
          name: res.data.customername,
          remainingAmount: remaining,
          bottlePrices: priceRatesToBottlePrices(res.data.priceRates || []),
          phone: res.data.phone || ''
        };
        setCustomers(updated);
        setCurrentEditIndex(null);
        handleEditClose();
        resetForm();
      } catch (err) {
        // handle error
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      bottlePrices: Object.fromEntries(bottleTypes.map(type => [type, 0])),
    });
  };

  function handleEdit(index: number): void {
    // populate form with selected customer and open edit dialog
    const c = customers[index];
    setCurrentEditIndex(index);
    setFormData({
      name: c.name || c.customername || '',
      phone: c.phone || '',
      bottlePrices: c.bottlePrices || Object.fromEntries(bottleTypes.map(type => [type, 0])),
    });
    setEditOpen(true);
  }

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
                  <TableCell align="center"><strong>Customer Name</strong></TableCell>
                  <TableCell align="center"><strong>Phone</strong></TableCell>
                  <TableCell align="center"><strong>Remaining Balance(Rs)</strong></TableCell>
                  <TableCell align="center" colSpan={bottleTypes.length}><strong>Bottle Prices (Rs)</strong></TableCell>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell align="center">{customer.name}</TableCell>
                      <TableCell align="center">{customer.phone}</TableCell>
                      <TableCell align="center">Rs. {customer.remainingAmount || 0}</TableCell>
                      {bottleTypes.map(type => (
                        <TableCell key={type} align="center">Rs. {customer.bottlePrices[type] || 0}</TableCell>
                      ))}
                      <TableCell align="center">
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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '24px', paddingTop: '20px' }}>
            <TextField 
              label="Name" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField 
              label="Phone" 
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              fullWidth
            />
            
            {/* Bottle Prices Section */}
            <div style={{ marginTop: '20px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {bottleTypes.map(type => (
                  <TextField
                    key={type}
                    label={`${type} Price`}
                    type="number"
                    value={formData.bottlePrices[type] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bottlePrices: {
                        ...formData.bottlePrices,
                        [type]: +e.target.value || 0
                      }
                    })}
                    size="small"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '4px', color: '#666' }}>Rs.</span>
                    }}
                  />
                ))}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddCustomer} variant="contained">Save</Button>
            <Button onClick={handleClose} color="secondary">Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '24px', paddingTop: '20px' }}>
            <TextField 
              label="Name" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField 
              label="Phone" 
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              fullWidth
            />
            
            {/* Bottle Prices Section */}
            <div style={{ marginTop: '20px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>Bottle Prices (Rs):</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {bottleTypes.map(type => (
                  <TextField
                    key={type}
                    label={`${type} Price`}
                    type="number"
                    value={formData.bottlePrices[type] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bottlePrices: {
                        ...formData.bottlePrices,
                        [type]: +e.target.value || 0
                      }
                    })}
                    size="small"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '4px', color: '#666' }}>Rs.</span>
                    }}
                  />
                ))}
              </div>
            </div>
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

