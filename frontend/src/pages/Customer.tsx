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

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '19L'];

interface Customer {
  name: any;
  _id?: string;
  customername?: string;
  phone: string;
  balance: number;
  createdAt: string;
  priceRates?: { bottleType: string; price: number }[];
  bottlePrices: { [key: string]: number };
  idnumber?: string;
  address?: string;
  email?: string;
  type?: string;
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
    balance: 0,
    createdAt: new Date().toISOString().split('T')[0],
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
  // Fetch customers from backend
  React.useEffect(() => {
    axios.get(apiBase)
      .then(res => {
        setCustomers(
          res.data.map((c: any) => ({
            ...c,
            name: c.customername,
            bottlePrices: priceRatesToBottlePrices(c.priceRates || []),
            balance: c.balance || 0,
            createdAt: c.createdAt ? c.createdAt.split('T')[0] : '',
          }))
        );
      })
      .catch(err => {
        // handle error
      });
  }, []);

  // Add customer
  const handleAddCustomer = async () => {
    const payload = {
      customername: formData.name,
      phone: formData.phone,
      balance: formData.balance,
      createdAt: formData.createdAt,
      priceRates: bottlePricesToPriceRates(formData.bottlePrices),
      idnumber: 'AUTO', // or get from form if needed
      address: 'N/A',   // or get from form if needed
      email: `${formData.name.replace(/\s+/g, '').toLowerCase()}@example.com`, // or get from form
      type: 'regular',  // or get from form
    };
    try {
      const res = await axios.post(`${apiBase}/add`, payload);
      setCustomers([
        ...customers,
        {
          ...res.data,
          name: res.data.customername,
          bottlePrices: priceRatesToBottlePrices(res.data.priceRates || []),
          balance: res.data.balance || 0,
          createdAt: res.data.createdAt ? res.data.createdAt.split('T')[0] : '',
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
        balance: formData.balance,
        createdAt: formData.createdAt,
        priceRates: bottlePricesToPriceRates(formData.bottlePrices),
        idnumber: customer.idnumber || 'AUTO',
        address: customer.address || 'N/A',
        email: customer.email || `${formData.name.replace(/\s+/g, '').toLowerCase()}@example.com`,
        type: customer.type || 'regular',
      };
      try {
        const res = await axios.put(`${apiBase}/${customer._id}`, payload);
        const updated = [...customers];
        updated[currentEditIndex] = {
          ...res.data,
          name: res.data.customername,
          bottlePrices: priceRatesToBottlePrices(res.data.priceRates || []),
          balance: res.data.balance || 0,
          createdAt: res.data.createdAt ? res.data.createdAt.split('T')[0] : '',
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
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      bottlePrices: Object.fromEntries(bottleTypes.map(type => [type, 0])),
    });
  };

  function handleEdit(index: number): void {
    throw new Error('Function not implemented.');
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
                  <TableCell align="center"><strong>Remaining Balance (Rs)</strong></TableCell>
                  <TableCell align="center" colSpan={bottleTypes.length}><strong>Bottle Prices (Rs)</strong></TableCell>
                  <TableCell align="center"><strong>Created At</strong></TableCell>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell align="center">{customer.name}</TableCell>
                      <TableCell align="center">{customer.phone}</TableCell>
                      <TableCell align="center">Rs. {customer.balance.toFixed(2)}</TableCell>
                      {bottleTypes.map(type => (
                        <TableCell key={type} align="center">Rs. {customer.bottlePrices[type] || 0}</TableCell>
                      ))}
                      <TableCell align="center">{customer.createdAt}</TableCell>
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
            <TextField 
              label="Balance" 
              type="number" 
              value={formData.balance} 
              onChange={e => setFormData({ ...formData, balance: +e.target.value })} 
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
            <TextField 
              label="Balance" 
              type="number" 
              value={formData.balance} 
              onChange={e => setFormData({ ...formData, balance: +e.target.value })} 
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
