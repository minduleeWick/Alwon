import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import '../styles/theme.css';
import {
  Tabs,
  Tab,
  Box,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import axios from '../utils/axiosConfig';
import InvoicePreview from '../components/BillPrint';

interface Customer {
  _id: string;
  customername: string;
  phone: string;
}

interface StockItem {
  itemCode: string;
  itemName: string;
  brand: string;
  availablequantity: number;
  sellingprice: number;
  pricePerUnit: number;
}

interface Bottle {
  type: string;
  quantity: number;
  price: number;
}

type BottleKey = 'type' | 'quantity' | 'price';

const bottleSizes = ['500ml', '1L', '1.5L', '5L', '20L'];

const Billing: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bottles, setBottles] = useState<Bottle[]>([{ type: '', quantity: 1, price: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeStatus, setChequeStatus] = useState('Pending');
  const [creditLimit, setCreditLimit] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [creditAmount, setCreditAmount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [creditSummaries, setCreditSummaries] = useState<any[]>([]);
  const [brand, setBrand] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  });
  const printRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get('/api/customers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched customers:', res.data);
        const validCustomers = res.data.filter(
          (c: any) => c._id && typeof c.customername === 'string' && c.phone
        );
        setCustomers(validCustomers);
        if (validCustomers.length !== res.data.length) {
          setSnackbar({
            open: true,
            message: 'Some customers have invalid data and were excluded',
            severity: 'warning',
          });
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setSnackbar({ open: true, message: 'Failed to fetch customers', severity: 'error' });
      }
    };
    fetchCustomers();
  }, []);

  // Fetch stock
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get('/api/inventory/stock', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched stock:', res.data);
        setStock(res.data);
      } catch (err) {
        console.error('Error fetching stock:', err);
        setSnackbar({ open: true, message: 'Failed to fetch stock data', severity: 'error' });
      }
    };
    fetchStock();
  }, []);

  // Fetch credit summaries
  useEffect(() => {
    const fetchCreditSummaries = async () => {
      try {
        const res = await axios.get('/api/payments/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched credit summaries:', res.data);
        setCreditSummaries(res.data);
      } catch (err) {
        console.error('Error fetching credit summaries:', err);
        setSnackbar({ open: true, message: 'Failed to fetch credit summaries', severity: 'error' });
      }
    };
    fetchCreditSummaries();
  }, []);

  // Update remainingAmount when a customer is selected
  useEffect(() => {
    if (tabIndex === 0 && selectedCustomer) {
      const summary = creditSummaries.find((s) => s.customerId === selectedCustomer);
      setRemainingAmount(summary ? summary.balance : 0);
    } else {
      setRemainingAmount(0);
    }
  }, [tabIndex, selectedCustomer, creditSummaries]);

  // Recalculate credit amount
  useEffect(() => {
    if (paymentMethod === 'Credit') {
      const total = calculateTotal();
      const difference = total - paidAmount;
      setCreditAmount(difference > 0 ? difference : 0);
    } else {
      setCreditAmount(0);
    }
  }, [paymentMethod, paidAmount, bottles]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setGuestName('');
    setGuestPhone('');
    setBottles([{ type: '', quantity: 1, price: 0 }]);
  };

  const filteredCustomers = customers.filter((c) =>
    c.customername?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const customerName = tabIndex === 0
    ? customers.find((c) => c._id === selectedCustomer)?.customername || ''
    : guestName;

  const customerPhone = tabIndex === 0
    ? customers.find((c) => c._id === selectedCustomer)?.phone || ''
    : guestPhone;

  const handleAddBottle = () => {
    setBottles([...bottles, { type: '', quantity: 1, price: 0 }]);
  };

  const handleDeleteBottle = (index: number) => {
    const updated = [...bottles];
    updated.splice(index, 1);
    setBottles(updated);
  };

  const handleBottleChange = (index: number, key: BottleKey, value: string | number) => {
    const updated = [...bottles];
    const bottle = { ...updated[index] };

    if (key === 'quantity') {
      const newQuantity = Number(value);
      if (newQuantity < 1) {
        setSnackbar({
          open: true,
          message: 'Quantity must be at least 1.',
          severity: 'error',
        });
        return;
      }
      const stockItem = stock.find((s) => s.itemCode === bottle.type && s.brand === brand);
      if (stockItem && newQuantity > stockItem.availablequantity) {
        setSnackbar({
          open: true,
          message: `Not enough stock for '${bottle.type}'. Available: ${stockItem.availablequantity}, Requested: ${newQuantity}`,
          severity: 'error',
        });
        return;
      }
      bottle.quantity = newQuantity;
    } else if (key === 'price') {
      bottle.price = Number(value);
    } else if (key === 'type') {
      bottle.type = String(value);
      // Reset quantity and price when type changes
      bottle.quantity = 1;
      const stockItem = stock.find((s) => s.itemCode === bottle.type);
      bottle.price = stockItem && tabIndex === 0 ? stockItem.sellingprice : 0;
    }

    updated[index] = bottle;
    setBottles(updated);
  };

  const calculateTotal = () =>
    bottles.reduce((sum, b) => sum + b.quantity * b.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (tabIndex === 0 && !selectedCustomer) {
      setSnackbar({ open: true, message: 'Please select a registered customer', severity: 'error' });
      return;
    }
    if (tabIndex === 1 && (!guestName || !guestPhone)) {
      setSnackbar({ open: true, message: 'Guest name and phone are required', severity: 'error' });
      return;
    }
    if (!bottles.every((b) => b.type && b.quantity >= 1 && b.price >= 0)) {
      setSnackbar({
        open: true,
        message: 'All bottles must have a type, quantity, and price',
        severity: 'error',
      });
      return;
    }
    if (!paymentMethod) {
      setSnackbar({ open: true, message: 'Payment method is required', severity: 'error' });
      return;
    }
    if (paymentMethod === 'Cheque' && (!chequeNo || !chequeDate || !bankName || !chequeStatus)) {
      setSnackbar({
        open: true,
        message: 'Cheque number, date, bank name, and status are required',
        severity: 'error',
      });
      return;
    }
    if (paymentMethod === 'Credit' && (creditLimit < 0 || !dueDate)) {
      setSnackbar({
        open: true,
        message: 'Credit limit and due date are required for Credit payments',
        severity: 'error',
      });
      return;
    }

    // Additional stock validation
    for (const bottle of bottles) {
      const stockItem = stock.find((s) => s.itemCode === bottle.type);
      if (!stockItem) {
        setSnackbar({
          open: true,
          message: `Item '${bottle.type}' not found in inventory`,
          severity: 'error',
        });
        return;
      }
      if (stockItem.availablequantity < bottle.quantity) {
        setSnackbar({
          open: true,
          message: `Not enough stock for '${bottle.type}'. Available: ${stockItem.availablequantity}, Requested: ${bottle.quantity}`,
          severity: 'error',
        });
        return;
      }
    }

    const billData = {
      customerId: tabIndex === 0 ? selectedCustomer : undefined,
      customerType: tabIndex === 0 ? 'registered' : 'guest',
      customerName,
      customerPhone,
      bottles,
      brand,
      amount: calculateTotal(),
      paidAmount: paymentMethod === 'Credit' ? paidAmount : calculateTotal(),
      creditAmount: paymentMethod === 'Credit' ? creditAmount : 0,
      remainingAmount: paymentMethod !== 'Cash' ? remainingAmount : 0,
      paymentMethod,
      chequeNo: paymentMethod === 'Cheque' ? chequeNo : undefined,
      chequeDate: paymentMethod === 'Cheque' ? chequeDate : undefined,
      bankName: paymentMethod === 'Cheque' ? bankName : undefined,
      chequeStatus: paymentMethod === 'Cheque' ? chequeStatus : undefined,
      creditLimit: paymentMethod === 'Credit' ? creditLimit : undefined,
      dueDate: paymentMethod === 'Credit' ? dueDate : undefined,
    };

    try {
      console.log('Bill Data to Save:', billData);
      await axios.post('/api/payments/issue', billData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: 'Bill recorded successfully', severity: 'success' });
      setSuccess(true);

      // Reset form
      setTabIndex(0);
      setCustomerSearch('');
      setSelectedCustomer(null);
      setGuestName('');
      setGuestPhone('');
      setBottles([{ type: '', quantity: 1, price: 0 }]);
      setPaymentMethod('Cash');
      setRemainingAmount(0);
      setChequeNo('');
      setChequeDate('');
      setBankName('');
      setChequeStatus('Pending');
      setCreditLimit(0);
      setDueDate('');
      setPaidAmount(0);
      setCreditAmount(0);

      // Refresh stock
      const stockRes = await axios.get('/api/inventory/stock', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStock(stockRes.data);
    } catch (err: any) {
      console.error('Error saving bill:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error saving bill',
        severity: 'error',
      });
    }
  };

  const handlePrint = () => window.print();

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Group stock by brand for table display
  const stockByBrand = stock.reduce((acc, item) => {
    if (!acc[item.brand]) {
      acc[item.brand] = [];
    }
    acc[item.brand].push(item);
    return acc;
  }, {} as { [key: string]: StockItem[] });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div className="card billing-card" style={{ flex: 3 }}>
          <div
            style={{
              textAlign: 'center',
              fontSize: 'x-large',
              fontWeight: 'bold',
              color: '#0d4483',
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            <h1>Invoice</h1>
          </div>

          <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 2 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} centered>
              <Tab label="Registered Customer" />
              <Tab label="Guest Customer" />
            </Tabs>
          </Box>

          <form onSubmit={handleSubmit}>
            {tabIndex === 0 && (
              <div className="customer-search">
                <input
                  type="text"
                  placeholder="Type customer name"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomer(null);
                  }}
                />
                {customerSearch && !selectedCustomer && (
                  <ul className="customer-list">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => (
                        <li
                          key={c._id}
                          onClick={() => {
                            setSelectedCustomer(c._id);
                            setCustomerSearch(c.customername);
                          }}
                        >
                          {c.customername} ({c.phone})
                        </li>
                      ))
                    ) : (
                      <li>No matches found</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {tabIndex === 1 && (
              <div className="guest-input-row">
                <div className="guest-input">
                  <label>
                    Name:
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div className="guest-input">
                  <label>
                    Phone:
                    <input
                      type="text"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />
                  </label>
                </div>
              </div>
            )}
            <div className="brand-select">
              <label>
                Brand:
                <select defaultValue='Select Brand' value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <option value="Brand A">Brand A</option>
                  <option value="Brand B">Brand B</option>
                  <option value="Brand C">Brand C</option>
                </select>
              </label>
            </div>

            <h3>Bottle Details</h3>
            {bottles.map((item, idx) => {
              const stockItem = stock.find((s) => s.itemCode === item.type);
              return (
                <div key={idx} className="bottle-row">
                  <select
                    value={item.type}
                    onChange={(e) => handleBottleChange(idx, 'type', e.target.value)}
                    required
                    disabled={brand === ''}
                  >
                    <option value="">Select Bottle Size</option>
                    {bottleSizes.map((size) => {
                      const stockForSize = stock.find((s) => s.itemCode === size && s.brand === brand);
                      return (
                        <option
                          key={size}
                          value={size}
                          disabled={stockForSize ? stockForSize.availablequantity <= 0 : true}
                        >
                          {size} {stockForSize ? `(Stock: ${stockForSize.availablequantity})` : '(No Stock)'}
                        </option>
                      );
                    })}
                  </select>
                  <label>
                    Qty:
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleBottleChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Price:
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.price}
                      onChange={(e) => handleBottleChange(idx, 'price', e.target.value)}
                      readOnly={tabIndex === 0 && stockItem != null}
                      required
                    />
                  </label>
                  <button type="button" className="delete-button" onClick={() => handleDeleteBottle(idx)}>
                    🗑
                  </button>
                  {idx === bottles.length - 1 && (
                    <button type="button" className="add-button" onClick={handleAddBottle}>
                      ➕
                    </button>
                  )}
                </div>
              );
            })}

            <div className="total-line">
              <h3>Total: Rs. {calculateTotal().toFixed(2)}</h3>
            </div>

            <div className="payment-row">
              <div className="payment-method">
                <label>
                  Payment Method:
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit</option>
                  </select>
                </label>
              </div>

              {paymentMethod === 'Cheque' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div className="remaining-amount">
                    <label>
                      Remaining Amount:
                      <input
                        type="number"
                        min={0}
                        value={remainingAmount}
                        onChange={(e) => setRemainingAmount(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="cheque-no">
                    <label>
                      Cheque No:
                      <input
                        type="text"
                        value={chequeNo}
                        onChange={(e) => setChequeNo(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="bank-name">
                    <label>
                      Bank Name:
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="cheque-status">
                    <label>
                      Cheque Status:
                      <select
                        value={chequeStatus}
                        onChange={(e) => setChequeStatus(e.target.value)}
                        required
                      >
                        <option value="Pending">Pending</option>
                        <option value="Cleared">Cleared</option>
                        <option value="Bounced">Bounced</option>
                      </select>
                    </label>
                  </div>
                  <div className="cheque-date">
                    <label>
                      Cheque Date:
                      <input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="amount">
                    <label>
                      Amount:
                      <input type="text" value={calculateTotal().toFixed(2)} readOnly />
                    </label>
                  </div>
                </div>
              )}

              {paymentMethod === 'Credit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div className="remaining-amount">
                    <label>
                      Remaining Amount:
                      <input
                        type="number"
                        min={0}
                        value={remainingAmount}
                        onChange={(e) => setRemainingAmount(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="paid-amount">
                    <label>
                      Paid Amount:
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="credit-amount">
                    <label>
                      Credit Amount:
                      <input type="number" value={creditAmount.toFixed(2)} readOnly />
                    </label>
                  </div>
                  <div className="credit-limit">
                    <label>
                      Credit Limit:
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(Number(e.target.value))}
                        required
                      />
                    </label>
                  </div>
                  <div className="due-date">
                    <label>
                      Due Date:
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="button-submit">
              Submit Bill
            </button>
          </form>

          {success && (
            <>
              <InvoicePreview
                ref={printRef}
                customerName={customerName}
                customerPhone={customerPhone}
                paymentMethod={paymentMethod}
                bottles={bottles}
                date={new Date().toISOString().split('T')[0]}
                bankName={paymentMethod === 'Cheque' ? bankName : undefined}
                chequeStatus={paymentMethod === 'Cheque' ? chequeStatus : undefined}
                creditLimit={paymentMethod === 'Credit' ? creditLimit : undefined}
                dueDate={paymentMethod === 'Credit' ? dueDate : undefined}
              />
              <button onClick={handlePrint}>Print</button>
            </>
          )}

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

        <div style={{ flex: 1, marginTop: '2rem' }}>
          <h3>Current Stock by Brand</h3>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Brand</TableCell>
                  <TableCell>Bottle Size</TableCell>
                  <TableCell>Available Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stockByBrand).map(([brand, items]) =>
                  (items as StockItem[]).map((item, idx) => (
                    <TableRow key={`${brand}-${item.itemCode}`}>
                      {idx === 0 && (
                        <TableCell rowSpan={items.length}>{brand}</TableCell>
                      )}
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.availablequantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <style>{`
        .bottle-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .guest-input-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .customer-search {
          position: relative;
          margin-bottom: 1rem;
        }
        .customer-list {
          position: absolute;
          background: white;
          border: 1px solid #ccc;
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
          width: 100%;
        }
        .customer-list li {
          padding: 8px;
          cursor: pointer;
        }
        .customer-list li:hover {
          background: #f0f0f0;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill, #printable-bill * {
            visibility: visible;
          }
          #printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default Billing;