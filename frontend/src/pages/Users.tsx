import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Paper, TableContainer, TablePagination
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from '../utils/axiosConfig';

interface User {
  _id: string;
  username: string;
  userid: string;
  role: 'admin' | 'user';
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState<{ username: string; userid: string; password?: string; role: 'user' | 'admin' }>({ username: '', userid: '', role: 'user' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const token = localStorage.getItem('token');

  const loadUsers = async () => {
    const res = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editing) {
        // Update existing user
        const updateData = { ...formData };
        if (!formData.password) delete updateData.password; // Don't send password if not changed

        await axios.put(`/api/users/${editing._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add new user
        await axios.post('/api/users/register', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setOpen(false);
      setEditing(null);
      setFormData({ username: '', userid: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      alert('Error saving user');
    }
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setFormData({ ...user, password: '' });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    loadUsers();
  };

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <h2>User Management</h2>
          <Button variant="contained" onClick={() => {
            setEditing(null);
            setFormData({ username: '', userid: '', password: '', role: 'user' });
            setOpen(true);
          }}>
            Add User
          </Button>
        </div>

        <Paper sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="user table" sx={{
              '& th, & td': {
                borderRight: '1px solid #ccc',
              },
              '& th:last-child, & td:last-child': {
                borderRight: 'none',
              }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(user => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.userid}</TableCell>
                    <TableCell>{user.role === 'user' ? 'Cashier' : 'Admin'}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(user)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(user._id)} color="error">
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
          />
        </Paper>

        {/* Add/Edit User Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 300 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <TextField
              label="User ID"
              value={formData.userid}
              onChange={e => setFormData({ ...formData, userid: e.target.value })}
              required
              disabled={!!editing}
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editing ? '(Leave blank to keep unchanged)' : ''}
              required={!editing}
            />
            <TextField
              select
              label="Role"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">Cashier</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSubmit} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Users;
