// ---- frontend/src/pages/Inventory.tsx ----
import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import '../styles/inventory.css';
import { v4 as uuidv4 } from 'uuid';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Paper,
  TablePagination,
  IconButton,
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryForm from '../components/InventoryForm';
import EditInventoryForm from '../components/EditInventoryForm';
import axios from 'axios';

interface BottleEntry {
        itemName: string,
        itemCode: string,
        quantity: number,
        pricePerUnit: number,
        supplierName: string,
        availablequantity: number,
        sellingprice: number,
        totalreavanue: number,
        soldquantity: number,
        profitearn: number,
}

interface InventoryItem {
  _id: string;
  date: string;
  bottles: BottleEntry[];
}

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '19L'];

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [filters, setFilters] = useState<{ [key: string]: string }>({
    date: '',
    ...Object.fromEntries(bottleTypes.map(type => [type, ''])),
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory');
      setInventory(response.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to fetch inventory', severity: 'error' });
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAdd = () => {
    setCurrentItem(null);
    setOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    console.log('Editing item:', item); // Debug log
    setCurrentItem(item);
    setEditOpen(true);
  };

  const handleDeleteConfirm = (item: InventoryItem) => {
    setCurrentItem(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (!currentItem?._id) throw new Error("Missing inventory ID");
      await axios.delete(`http://localhost:5000/api/inventory/${currentItem._id}`);
      await fetchInventory();
      setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', severity: 'error' });
    } finally {
      setDeleteOpen(false);
      setCurrentItem(null);
    }
  };

  const normalizeBottles = (bottles: BottleEntry[]): BottleEntry[] =>
    bottles.map((bottle, index) => ({
      ...bottle,
      itemName: bottle.itemName || `${bottle.itemCode || 'bottle-' + index} Water Bottle`,
      itemCode: bottle.itemCode || `bottle-${Date.now()}-${index}`, // Fallback itemCode
      availablequantity: bottle.availablequantity ?? bottle.quantity,
      pricePerUnit: bottle.pricePerUnit ?? 100,
      supplierName: bottle.supplierName ?? 'Default Supplier',
      sellingprice: bottle.sellingprice ?? 150,
      totalreavanue: bottle.totalreavanue ?? 0,
      soldquantity: bottle.soldquantity ?? 0,
      profitearn: bottle.profitearn ?? 0,
    }));

  const handleSubmit = async (items: InventoryItem[]) => {
    try {
      const { _id, date, bottles } = items[0];
      
      // Log for debugging
      console.log('Submitting inventory:', { _id, date, bottles });

      const payload = { date, bottles: normalizeBottles(bottles) };

      if (_id && _id !== '') {
        // Edit mode: Call PUT endpoint
        await axios.put(`http://localhost:5000/api/inventory/${_id}`, payload);
        setSnackbar({ open: true, message: 'Inventory updated!', severity: 'success' });
        setEditOpen(false);
      } else {
        // Add mode: Call POST endpoint
        await axios.post('http://localhost:5000/api/inventory/add', payload);
        setSnackbar({ open: true, message: 'Inventory added!', severity: 'success' });
        setOpen(false);
      }

      await fetchInventory();
    } catch (err: any) {
      console.error('Submission error:', err);
      setSnackbar({ open: true, message: err.message || 'Operation failed', severity: 'error' });
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesDate = filters.date === '' || item.date.includes(filters.date);
    // Fix here: ensure bottles is defined before mapping
    const bottleMap = Object.fromEntries((item.bottles ?? []).map((b) => [b.itemCode, b.quantity.toString()]));

    const matchesQuantities = bottleTypes.every(type => {
      const filterVal = filters[type];
      if (!filterVal) return true;
      return (bottleMap[type] || '') === filterVal;
    });

    return matchesDate && matchesQuantities;
  });

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <h2>Inventory</h2>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>Add New</Button>
        </div>

        <Paper>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  {bottleTypes.map((type) => (
                    <TableCell key={type} align="center">{type}</TableCell>
                  ))}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <input
                      type="date"
                      value={filters.date}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    />
                  </TableCell>
                  {bottleTypes.map((type) => (
                    <TableCell key={type}>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={filters[type]}
                        onChange={(e) => setFilters({ ...filters, [type]: e.target.value })}
                      />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredInventory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => {
                    // Fix here: ensure bottles is defined before mapping
                    const bottleMap = Object.fromEntries((item.bottles ?? []).map(b => [b.itemCode, b.quantity]));
                    return (
                      <TableRow key={item._id}>
                        <TableCell>{item.date}</TableCell>
                        {bottleTypes.map(type => (
                          <TableCell key={type} align="center">{bottleMap[type] || 0}</TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton onClick={() => handleEdit(item)}><EditIcon /></IconButton>
                          <IconButton onClick={() => handleDeleteConfirm(item)} color="error"><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          count={filteredInventory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(+e.target.value);
            setPage(0);
          }}
          component="div"
          sx={{ display: 'flex', justifyContent: 'flex-end' }}
        />
        </Paper>

        {/* Add Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Stock</DialogTitle>
          <DialogContent>
            <InventoryForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Stock</DialogTitle>
        <DialogContent>
          {currentItem && (
            <InventoryForm
              onSubmit={handleSubmit}
              onCancel={() => setEditOpen(false)}
              initialData={currentItem}
              isEditMode
            />
          )}
        </DialogContent>
      </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this record?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </AdminLayout>
  );
};

export default Inventory;
