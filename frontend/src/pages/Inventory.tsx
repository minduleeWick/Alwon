// ---- frontend/src/pages/Inventory.tsx ----
import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import '../styles/inventory.css';

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
  DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryForm from '../components/InventoryForm';
import EditInventoryForm from '../components/EditInventoryForm';

interface InventoryItem {
  date: string;
  bottles: {
    type: string;
    quantity: number;
  }[];
}

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '19L'];

const sampleInventory: InventoryItem[] = [
  {
    date: '2025-07-01',
    bottles: [
      { type: '500ml', quantity: 120 },
      { type: '1L', quantity: 80 },
    ],
  },
  {
    date: '2025-07-03',
    bottles: [
      { type: '1.5L', quantity: 60 },
      { type: '5L', quantity: 30 },
      { type: '19L', quantity: 10 },
    ],
  },
];

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventory);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [filters, setFilters] = useState<{ [key: string]: string }>({
    date: '',
    ...Object.fromEntries(bottleTypes.map(type => [type, ''])),
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);
  const handleDeleteClose = () => setDeleteOpen(false);

  const handleAddInventory = (newItem: InventoryItem) => {
    setInventory([...inventory, newItem]);
    handleClose();
  };

  const handleEdit = (index: number) => {
    setCurrentEditIndex(index);
    setEditOpen(true);
  };

  const handleUpdateInventory = (updatedItem: InventoryItem) => {
    if (currentEditIndex !== null) {
      const updated = [...inventory];
      updated[currentEditIndex] = updatedItem;
      setInventory(updated);
      setCurrentEditIndex(null);
    }
    handleEditClose();
  };

  const handleDelete = () => {
    if (currentEditIndex !== null) {
      const updated = [...inventory];
      updated.splice(currentEditIndex, 1);
      setInventory(updated);
      setCurrentEditIndex(null);
    }
    handleDeleteClose();
  };

  const handleDeleteConfirm = (index: number) => {
    setCurrentEditIndex(index);
    setDeleteOpen(true);
  };

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters({ ...filters, [columnId]: value });
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesDate = filters.date === '' || item.date.includes(filters.date);
    const bottleMap = Object.fromEntries(item.bottles.map(b => [b.type, b.quantity.toString()]));

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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add New
          </Button>
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
                <TableRow>
                  <TableCell align="center" colSpan={1}>Date</TableCell>
                  <TableCell align="center" colSpan={bottleTypes.length}>Bottle Stock Details</TableCell>
                  <TableCell align="center" colSpan={1}>Actions</TableCell>
                </TableRow>
            <TableRow>
              <TableCell />
              {bottleTypes.map(type => (
                <TableCell key={type} align="center"><strong>{type}</strong></TableCell>
              ))}
              <TableCell />
            </TableRow>
                <TableRow>
                  <TableCell>
                    <input
                      type="date"
                      value={filters.date}
                      onChange={(e) => handleFilterChange('date', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </TableCell>
                  {bottleTypes.map((type) => (
                    <TableCell key={type}>
                      <input
                        type="number"
                        value={filters[type]}
                        onChange={(e) => handleFilterChange(type, e.target.value)}
                        style={{ width: '100%' }}
                        placeholder="Qty"
                      />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredInventory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item, index) => {
                    const bottleMap = Object.fromEntries(item.bottles.map(b => [b.type, b.quantity]));
                    return (
                      <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                        <TableCell>{item.date}</TableCell>
                        {bottleTypes.map((type) => (
                          <TableCell key={type} align="center">
                            {bottleMap[type] || 0}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton className="edit-btn" onClick={() => handleEdit(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton className="delete-btn" onClick={() => handleDeleteConfirm(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInventory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Paper>

        {/* Add New Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Stock</DialogTitle>
          <DialogContent>
            <InventoryForm onSubmit={handleAddInventory} onCancel={handleClose} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Stock</DialogTitle>
          <DialogContent>
            {currentEditIndex !== null && (
              <EditInventoryForm
                initialData={inventory[currentEditIndex]}
                onSubmit={handleUpdateInventory}
                onCancel={handleEditClose}
              />
            )}
          </DialogContent>
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

export default Inventory;
