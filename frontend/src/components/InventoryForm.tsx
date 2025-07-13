import React, { useState } from 'react';
import { Button, TextField, MenuItem, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const bottleSizes = ['500ml', '1L', '5L', '20L'];

interface BottleEntry {
  type: string;
  quantity: number;
}

interface InventoryItem {
  date: string;
  bottles: BottleEntry[];
}

interface Props {
  onSubmit: (item: InventoryItem) => void;
  onCancel: () => void;
}

const InventoryForm: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const [date, setDate] = useState('');
  const [bottles, setBottles] = useState<BottleEntry[]>([
    { type: '', quantity: 0 },
  ]);

  const handleBottleChange = (index: number, field: keyof BottleEntry, value: string | number) => {
    const updated = [...bottles];
    const bottle = { ...updated[index] };
    if (field === 'type') bottle.type = String(value);
    else if (field === 'quantity') bottle.quantity = Number(value);
    updated[index] = bottle;
    setBottles(updated);
  };

  const handleAddBottle = () => {
    setBottles([...bottles, { type: '', quantity: 0 }]);
  };

  const handleRemoveBottle = (index: number) => {
    const updated = [...bottles];
    updated.splice(index, 1);
    setBottles(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, bottles });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        margin="normal"
        required
      />

      {bottles.map((bottle, index) => (
        <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <TextField
            select
            label="Bottle Type"
            value={bottle.type}
            onChange={(e) => handleBottleChange(index, 'type', e.target.value)}
            required
            fullWidth
          >
            {bottleSizes.map((size) => (
              <MenuItem key={size} value={size}>{size}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Quantity"
            type="number"
            value={bottle.quantity}
            onChange={(e) => handleBottleChange(index, 'quantity', Number(e.target.value))}
            required
            fullWidth
          />
          <IconButton onClick={() => handleRemoveBottle(index)} color="error">
            <DeleteIcon />
          </IconButton>
          {index === bottles.length - 1 && (
            <IconButton onClick={handleAddBottle} color="primary">
              <AddIcon />
            </IconButton>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">Add</Button>
      </div>
    </form>
  );
};

export default InventoryForm;
