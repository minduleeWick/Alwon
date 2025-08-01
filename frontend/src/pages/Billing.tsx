import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import '../styles/theme.css';
import {
  Tabs,
  Tab,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from '../utils/axiosConfig';
import InvoicePreview from '../components/BillPrint';

interface Customer {
  _id: string;
  name: string;
  phone: string;
}

const bottleSizes = ['500ml', '1L', '5L', '20L'];

type BottleKey = 'type' | 'quantity' | 'price';

const Billing: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bottles, setBottles] = useState([{ type: '', quantity: 1, price: 0 }]);
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
        console.log('Fetched customers:', res.data); // Debug log
        // Filter out invalid customers
        const validCustomers = res.data.filter(
          (c: any) => c._id && typeof c.name === 'string' && c.phone
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

  // Recalculate credit amount
  useEffect(() => {
    if (paymentMethod === 'credit') {
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
  };

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const customerName = tabIndex === 0
    ? customers.find((c) => c._id === selectedCustomer)?.name || ''
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
      bottle.quantity = Number(value);
    } else if (key === 'price') {
      bottle.price = Number(value);
    } else if (key === 'type') {
      bottle.type = String(value);
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
      setSnackbar({ open: true, message: 'All bottles must have a type, quantity, and price', severity: 'error' });
      return;
    }
    if (!paymentMethod) {
      setSnackbar({ open: true, message: 'Payment method is required', severity: 'error' });
      return;
    }
    if (paymentMethod === 'cheque' && (!chequeNo || !chequeDate)) {
      setSnackbar({ open: true, message: 'Cheque number and date are required', severity: 'error' });
      return;
    }

    const billData = {
      customerId: tabIndex === 0 ? selectedCustomer : undefined,
      customerType: tabIndex === 0 ? 'registered' : 'guest',
      customerName,
      customerPhone,
      bottles,
      amount: calculateTotal(),
      paidAmount: paymentMethod === 'Credit' ? paidAmount : calculateTotal(),
      creditAmount: paymentMethod === 'Credit' ? creditAmount : 0,
      remainingAmount: paymentMethod !== 'Cash' ? remainingAmount : 0,
      paymentMethod,
      chequeNo: paymentMethod === 'Cheque' ? chequeNo : '',
      chequeDate: paymentMethod === 'Cheque' ? chequeDate : '',
      bankName: paymentMethod === 'Cheque' ? bankName : '',
      chequeStatus: paymentMethod === 'Cheque' ? chequeStatus : '',
      creditLimit: paymentMethod === 'Credit' ? creditLimit : undefined,
      dueDate: paymentMethod === 'Credit' ? dueDate : '',
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
      setPaidAmount(0);
      setCreditAmount(0);
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

  return (
    <AdminLayout>
      <div className="card billing-card">
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
                          setCustomerSearch(c.name);
                        }}
                      >
                        {c.name} ({c.phone})
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

          <h3>Bottle Details</h3>
          {bottles.map((item, idx) => (
            <div key={idx} className="bottle-row">
              <select
                value={item.type}
                onChange={(e) => handleBottleChange(idx, 'type', e.target.value)}
                required
              >
                <option value="">Select Bottle Size</option>
                {bottleSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
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
          ))}

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
                <div className="amount">
                  <label>
                    Amount:
                    <input type="text" value={calculateTotal().toFixed(2)} readOnly />
                  </label>
                </div>
                <div className="cheque-no">
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
                <div className="cheque-no">
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
                <div className="date">
                  <label>
                    Date:
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      required
                    />
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
                <div className="amount">
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
                <div className="amount">
                  <label>
                    Credit Amount:
                    <input type="number" value={calculateTotal()-paidAmount} onChange={(e) => setCreditAmount(Number(e.target.value))}readOnly />
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

        <style>{`
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
      </div>
    </AdminLayout>
  );
};

export default Billing;