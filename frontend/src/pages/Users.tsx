import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  TableContainer,
  TablePagination,
  Snackbar,
  Alert,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from '../utils/axiosConfig';

interface User {
  _id: string;
  username: string;
  role: 'admin' | 'user';
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<{ username: string; password?: string; role: 'user' | 'admin' }>({
    username: '',
    role: 'user',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const token = localStorage.getItem('token');

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async () => {
    try {
      console.log('Submitting user data:', formData);
      if (editing) {
        // Update existing user
        const updateData = { ...formData };
        if (!formData.password) delete updateData.password; // Don't send password if not changed

        await axios.put(`/api/users/${editing._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      } else {
        // Add new user
        if (!formData.password) {
          setSnackbar({ open: true, message: 'Password is required for new users', severity: 'error' });
          return;
        }
        await axios.post('/api/users/register', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'User added successfully', severity: 'success' });
      }

      setOpen(false);
      setEditing(null);
      setFormData({ username: '', password: '', role: 'user' });
      loadUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error saving user',
        severity: 'error',
      });
    }
  };

  const handleEdit = (user: User) => {
    console.log('Editing user:', user);
    setEditing(user);
    setFormData({ ...user, password: '' });
    setOpen(true);
  };

  const handleDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (userToDelete && userToDelete._id) {
      try {
        await axios.delete(`/api/users/${userToDelete._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        loadUsers();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.error || 'Error deleting user',
          severity: 'error',
        });
      }
    }
    setDeleteOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setUserToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <h2>User Management</h2>
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setFormData({ username: '', password: '', role: 'user' });
              setOpen(true);
            }}
          >
            Add User
          </Button>
        </div>

        <Paper sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 440, width: '120%' }}>
            <Table
              stickyHeader
              aria-label="user table"
              sx={{
                '& th, & td': {
                  borderRight: '1px solid #ccc',
                },
                '& th:last-child, & td:last-child': {
                  borderRight: 'none',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role === 'user' ? 'Cashier' : 'Admin'}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(user)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteConfirm(user)} color="error">
                        <Delete />
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
            count={users.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
            sx={{ display: 'flex', justifyContent: 'flex-end' }}
          />
        </Paper>

        {/* Add/Edit User Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 300 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              error={!formData.username}
              helperText={!formData.username ? 'Username is required' : ''}
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editing ? '(Leave blank to keep unchanged)' : ''}
              required={!editing}
              error={!editing && (!formData.password || formData.password.trim() === '')}
              helperText={!editing && (!formData.password || formData.password.trim() === '') ? 'Password is required' : ''}
            />
            <TextField
              select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              required
              error={!formData.role}
              helperText={!formData.role ? 'Role is required' : ''}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">Cashier</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onClose={handleDeleteClose}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
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

export default Users;
