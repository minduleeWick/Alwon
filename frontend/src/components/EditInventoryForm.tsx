// components/EditInventoryForm.tsx
import React, { useState } from 'react';
import { Button, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';

interface Bottle {
  type: string;
  quantity: number;
}

interface InventoryItem {
  date: string;
  brand: string;
  bottles: Bottle[];
}

interface EditInventoryFormProps {
  initialData: InventoryItem;
  onSubmit: (updated: InventoryItem) => void;
  onCancel: () => void;
}

const bottleTypes = ['500ml', '1L', '1.5L', '5L', '19L'];

const EditInventoryForm: React.FC<EditInventoryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [date, setDate] = useState(initialData.date);
  const [brand, setBrand] = useState(initialData.brand || '');
  const [bottles, setBottles] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialData.bottles.forEach((b) => (map[b.type] = b.quantity));
    return map;
  });

  const handleChange = (type: string, quantity: number) => {
    setBottles({ ...bottles, [type]: quantity });
  };

  const handleSubmit = () => {
    const updatedItem: InventoryItem = {
      date,
      bottles: bottleTypes.map((type) => ({ type, quantity: bottles[type] || 0 })),
      brand
    };
    onSubmit(updatedItem);
  };

  return (
    <>
      <DialogTitle>Edit Inventory</DialogTitle>
      <DialogContent>
        <TextField
          label="Date"
          type="date"
          fullWidth
          value={date}
          onChange={(e) => setDate(e.target.value)}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Brand"
          fullWidth
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          margin="normal"
        />
        <Grid container spacing={2} component="div">
        {bottleTypes.map((type) => (
            <Grid  key={type}>
            <TextField
                label={`${type} Quantity`}
                type="number"
                fullWidth
                value={bottles[type] || 0}
                onChange={(e) => handleChange(type, Number(e.target.value))}
            />
            </Grid>
        ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Update</Button>
      </DialogActions>
    </>
  );
};

export default EditInventoryForm;
