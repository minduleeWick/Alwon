// frontend/src/components/InventoryForm.tsx
import React, { useState } from 'react';
import { Button, TextField, MenuItem, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const bottleSizes = ['500ml', '1L', '1.5L', '5L', '20L'];

interface BottleEntry {
  itemName: string;
  itemCode: string;
  quantity: number;
  pricePerUnit: number;
  supplierName: string;
  availablequantity: number;
  sellingprice: number;
  totalreavanue: number;
  soldquantity: number;
  profitearn: number;
}

interface InventoryItem {
  _id: string;
  date: string;
  bottles: BottleEntry[];
}

interface Props {
  onSubmit: (items: InventoryItem[]) => void;
  onCancel: () => void;
  initialData?: InventoryItem;
  isEditMode?: boolean;
}

const InventoryForm: React.FC<Props> = ({ onSubmit, onCancel, initialData, isEditMode }) => {
  const [date, setDate] = useState(initialData?.date || '');
  const [bottles, setBottles] = useState<BottleEntry[]>(
    initialData?.bottles || [
      {
        itemName: '',
        itemCode: '',
        quantity: 0,
        pricePerUnit: 0,
        supplierName: '',
        availablequantity: 0,
        sellingprice: 0,
        totalreavanue: 0,
        soldquantity: 0,
        profitearn: 0,
      },
    ]
  );

  const handleBottleChange = (index: number, field: keyof BottleEntry, value: string | number) => {
    const updated = [...bottles];
    const bottle = { ...updated[index] };
    if (field === 'itemCode') bottle.itemCode = String(value);
    else if (field === 'quantity') bottle.quantity = Number(value);
    else if (field === 'itemName') bottle.itemName = String(value);
    else if (field === 'pricePerUnit') bottle.pricePerUnit = Number(value);
    else if (field === 'supplierName') bottle.supplierName = String(value);
    else if (field === 'availablequantity') bottle.availablequantity = Number(value);
    else if (field === 'sellingprice') bottle.sellingprice = Number(value);
    else if (field === 'totalreavanue') bottle.totalreavanue = Number(value);
    else if (field === 'soldquantity') bottle.soldquantity = Number(value);
    else if (field === 'profitearn') bottle.profitearn = Number(value);
    updated[index] = bottle;
    setBottles(updated);
  };

  const handleAddBottle = () => {
    setBottles([
      ...bottles,
      {
        itemName: '',
        itemCode: '',
        quantity: 0,
        pricePerUnit: 0,
        supplierName: '',
        availablequantity: 0,
        sellingprice: 0,
        totalreavanue: 0,
        soldquantity: 0,
        profitearn: 0,
      },
    ]);
  };

  const handleRemoveBottle = (index: number) => {
    const updated = [...bottles];
    updated.splice(index, 1);
    setBottles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date
    if (!date) {
      alert('Please select a date.');
      return;
    }

    // Validate bottles
    const hasInvalidBottles = bottles.some(
      (bottle) =>
        !bottle.itemCode ||
        bottle.itemCode.trim() === '' ||
        bottle.quantity <= 0 ||
        isNaN(bottle.quantity)
    );

    if (hasInvalidBottles) {
      alert('Please ensure all bottles have a valid item code and quantity greater than 0.');
      return;
    }

    const items: InventoryItem[] = [
      {
        _id: isEditMode ? initialData?._id || '' : '', // Preserve _id in edit mode
        date,
        bottles: bottles.map((bottle) => ({
          itemName: bottle.itemName || `${bottle.itemCode} Water Bottle`,
          itemCode: bottle.itemCode,
          quantity: bottle.quantity,
          pricePerUnit: bottle.pricePerUnit || 100,
          supplierName: bottle.supplierName || 'Default Supplier',
          availablequantity: bottle.availablequantity || bottle.quantity,
          sellingprice: bottle.sellingprice || 150,
          totalreavanue: bottle.totalreavanue || 0,
          soldquantity: bottle.soldquantity || 0,
          profitearn: bottle.profitearn || 0,
        })),
      },
    ];

    onSubmit(items);
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
            value={bottle.itemCode}
            onChange={(e) => handleBottleChange(index, 'itemCode', e.target.value)}
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
        <Button
          type="submit"
          variant="contained"
          disabled={
            !date ||
            bottles.some(
              (bottle) =>
                !bottle.itemCode || bottle.itemCode.trim() === '' || bottle.quantity <= 0 || isNaN(bottle.quantity)
            )
          }
        >
          {isEditMode ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  );
};

export default InventoryForm;