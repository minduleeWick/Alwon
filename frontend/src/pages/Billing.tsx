import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import '../styles/theme.css';
import { 
  Tabs, 
  Tab, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import InvoicePreview from '../components/BillPrint';
import axios from 'axios';

const bottleSizes = ['500ml', '1L', '1.5L', '5L', '20L'];

type BottleKey = 'type' | 'quantity' | 'price';
//edwdasdad
interface Customer {
  _id: string;
  customername: string;
  phone: string;
  priceRates?: { bottleType: string; price: number }[];
}

const Billing: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0: Registered, 1: Guest
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bottles, setBottles] = useState([{ type: '', quantity: 1, price: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [success, setSuccess] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [brand, setBrand] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeStatus, setChequeStatus] = useState('Pending');
  const [creditLimit, setCreditLimit] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [stockData, setStockData] = useState<Array<{brand: string, bottleSize: string, quantity: number}>>([]);

  // store last bill for preview/printing after clearing form
  const [lastBill, setLastBill] = useState<any | null>(null);

  const paymentsApi = 'http://localhost:5000/api/payments/history';

  // Fetch customers from backend on mount
  useEffect(() => {
    if (tabIndex === 0) {
      axios.get(' http://localhost:5000/api/customers')
        .then(res => setCustomers(res.data))
        .catch(() => setCustomers([]));
    }
  }, [tabIndex]);

  // Fetch remaining balance when a registered customer is selected
  useEffect(() => {
    const fetchRemaining = async () => {
      if (tabIndex === 0 && selectedCustomer) {
        try {
          const res = await axios.get(paymentsApi, { params: { customerId: selectedCustomer } });
          const payments = Array.isArray(res.data) ? res.data : [];
          const remaining = payments.reduce((sum: number, p: any) => sum + (Number(p.remainingAmount ?? p.deupayment ?? 0) || 0), 0);
          setRemainingBalance(remaining);
        } catch (err) {
          console.error('Error fetching remaining balance:', err);
          setRemainingBalance(0);
        }
      } else {
        setRemainingBalance(0);
      }
    };
    fetchRemaining();
  }, [selectedCustomer, tabIndex]);

  // Fetch stock data from backend
  useEffect(() => {
    // Replace mock data with actual API call
    axios.get('http://localhost:5000/api/inventory/stock')
      .then(res => setStockData(res.data))
      .catch(err => {
        console.error("Error fetching stock data:", err);
        // Fallback to empty array if API fails
        setStockData([]);
      });
  }, []);

  // Recalculate credit amount whenever needed
  useEffect(() => {
    if (paymentMethod === 'credit') {
      const total = calculateTotal();
      const difference = total - paidAmount;
      setCreditAmount(difference > 0 ? difference : 0);
    } else {
      setCreditAmount(0);
    }
  }, [paymentMethod, paidAmount, bottles]);

  // When selectedCustomer or bottles change, auto-fill bottle prices for registered customers
  useEffect(() => {
    if (tabIndex === 0 && selectedCustomer) {
      const customer = customers.find(c => c._id === selectedCustomer);
      if (customer && customer.priceRates) {
        setBottles(prevBottles =>
          prevBottles.map(bottle => {
            if (!bottle.type) return bottle;
            const rate = customer.priceRates!.find(r => r.bottleType === bottle.type);
            return rate ? { ...bottle, price: rate.price } : bottle;
          })
        );
      }
    }
    // eslint-disable-next-line
  }, [selectedCustomer, bottles.map(b => b.type).join(','), tabIndex]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setSelectedCustomer(null);
    setGuestName('');
    setGuestPhone('');
    setBottles([{ type: '', quantity: 1, price: 0 }]);
  };

  // Remove duplicate customers by _id
  const uniqueCustomers = Array.from(
    new Map(customers.map(c => [c._id, c])).values()
  );

  const filteredCustomers = uniqueCustomers.filter(c =>
    c.customername.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const customerName = tabIndex === 0
    ? customers.find(c => c._id === selectedCustomer)?.customername || ''
    : guestName;

  const customerPhone = tabIndex === 0
    ? customers.find(c => c._id === selectedCustomer)?.phone || ''
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
      // Auto-fill price for registered customer
      if (tabIndex === 0 && selectedCustomer) {
        const customer = customers.find(c => c._id === selectedCustomer);
        if (customer && customer.priceRates) {
          const rate = customer.priceRates.find(r => r.bottleType === bottle.type);
          if (rate) {
            bottle.price = rate.price;
          }
        }
      }
    }

    updated[index] = bottle;
    setBottles(updated);
  };

  const calculateTotal = () =>
    bottles.reduce((sum, b) => sum + b.quantity * b.price, 0);

  // clear only the form fields (leave customers/stock/lastBill intact)
  const clearFormFields = () => {
    setTabIndex(0);
    setCustomerSearch('');
    setSelectedCustomer(null);
    setGuestName('');
    setGuestPhone('');
    setBottles([{ type: '', quantity: 1, price: 0 }]);
    setPaymentMethod('cash');
    setChequeNo('');
    setChequeDate('');
    setPaidAmount(0);
    setCreditAmount(0);
    setBrand('');
    setBankName('');
    setChequeStatus('Pending');
    setCreditLimit(0);
    setDueDate('');
  };

  // Helper: build priceRates array from bottles (unique by type)
  const buildPriceRatesFromBottles = (bottlesList: { type: string; price: number }[]) => {
    const map: Record<string, number> = {};
    bottlesList.forEach(b => {
      if (b.type) map[b.type] = Number(b.price) || 0;
    });
    return Object.entries(map).map(([bottleType, price]) => ({ bottleType, price }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bottles.length === 0 || bottles.some(b => !b.type || b.quantity < 1 || b.price <= 0)) {
      alert('Please add at least one bottle with valid type, quantity, and price');
      return;
    }

    if (!brand) {
      alert('Please select a brand');
      return;
    }

    // If guest, first create a regular customer, then continue with payment using returned customerId
    let customerIdForBill = tabIndex === 0 ? selectedCustomer : null;
    if (tabIndex === 1) {
      try {
        // build priceRates from bottles so guest is saved with the used prices
        const priceRatesForGuest = buildPriceRatesFromBottles(bottles);
        const createPayload = {
          customername: guestName,
          phone: guestPhone,
          type: 'regular',
          priceRates: priceRatesForGuest
        };
        const createRes = await axios.post('http://localhost:5000/api/customers/add', createPayload);
        const newCustomer = createRes.data;
        if (!newCustomer || !newCustomer._id) {
          throw new Error('Failed to create customer');
        }
        customerIdForBill = newCustomer._id;
        // add newly created customer to local customers list so UI updates immediately
        setCustomers(prev => {
          // avoid duplicates
          const exists = prev.some(c => c._id === newCustomer._id);
          if (exists) return prev;
          return [...prev, {
            _id: newCustomer._id,
            customername: newCustomer.customername || guestName,
            phone: newCustomer.phone || guestPhone,
            priceRates: newCustomer.priceRates || []
          }];
        });
      } catch (err: any) {
        alert('Failed to create customer: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
        return; // abort payment if customer creation fails
      }
    }

    const total = calculateTotal();

    const billData = {
      customerId: customerIdForBill,
      customerType: tabIndex === 0 ? 'registered' : 'registered', // guest becomes registered after creation
      guestInfo: tabIndex === 1 ? undefined : undefined, // guest info is not needed once customer created
      quantity: bottles.reduce((sum, b) => sum + b.quantity, 0),
      itemCode: bottles[0].type,
      itemName: bottles.map(b => b.type).join(', '),
      brand: brand,
      amount: total,
      payment: paymentMethod === 'credit' ? paidAmount
               : paymentMethod === 'cash' ? total
               : 0,
      deupayment: paymentMethod === 'credit' ? creditAmount
                  : paymentMethod === 'cheque' ? total
                  : 0,
      creaditlimit: creditLimit,
      paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
      status: 'pending',
      ...(paymentMethod === 'cheque' && {
        chequeNo,
        chequeDate,
        bankName,
        chequeStatus,
      }),
      bottles: bottles.map(b => ({
        type: b.type,
        quantity: b.quantity,
        price: b.price,
        brand: brand
      }))
    };

    try {
      const response = await axios.post(' http://localhost:5000/api/payments/issue', billData);
      console.log('Bill saved successfully:', response.data);

      // --- NEW: persist/merge priceRates for this customer so future invoices use updated prices ---
      if (customerIdForBill) {
        try {
          // build priceRates from the submitted bill (use billData.bottles which contains the submitted prices)
          const newRates = buildPriceRatesFromBottles(billData.bottles);
          // merge with existing customer rates (overwrite existing types with newRates)
          const existingCustomer = customers.find(c => c._id === (selectedCustomer || customerIdForBill));
          const mergedMap: Record<string, number> = {};
          (existingCustomer?.priceRates || []).forEach((r: any) => {
            mergedMap[r.bottleType] = r.price;
          });
          newRates.forEach((r: any) => {
            mergedMap[r.bottleType] = r.price; // overwrite or add
          });
          const mergedPriceRates = Object.entries(mergedMap).map(([bottleType, price]) => ({ bottleType, price }));

          // send update to backend (edit customer)
          await axios.put(`http://localhost:5000/api/customers/${customerIdForBill}`, {
            customername: existingCustomer?.customername || (tabIndex === 1 ? guestName : ''),
            phone: existingCustomer?.phone || (tabIndex === 1 ? guestPhone : ''),
            priceRates: mergedPriceRates,
            type: 'regular'
          });

          // update local customers state to reflect new rates immediately
          setCustomers(prev => prev.map(c => c._id === customerIdForBill ? { ...c, priceRates: mergedPriceRates } : c));
        } catch (err) {
          console.error('Failed to update customer priceRates after billing:', err);
        }
      }
      // --- END NEW ---

      // Keep a snapshot of the bill for printing, then clear the form
      setLastBill({
        customerName: tabIndex === 0 ? customers.find(c => c._id === selectedCustomer)?.customername || '' : guestName,
        customerPhone: tabIndex === 0 ? customers.find(c => c._id === selectedCustomer)?.phone || '' : guestPhone,
        paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        bottles: billData.bottles,
        date: new Date().toISOString().split('T')[0],
        bankName: paymentMethod === 'cheque' ? bankName : undefined,
        chequeStatus: paymentMethod === 'cheque' ? chequeStatus : undefined,
        creditLimit: paymentMethod === 'credit' ? creditLimit : undefined,
        dueDate: dueDate || undefined
      });

      // reset the form inputs (do this after merging/updating customer rates)
      clearFormFields();
      // show preview (uses lastBill)
      setSuccess(true);

      // Refresh stock data immediately after successful payment
      axios.get('http://localhost:5000/api/inventory/stock')
        .then(res => setStockData(res.data))
        .catch(err => {
          console.error("Error fetching updated stock data:", err);
        });

      // Refresh remaining balance after creating bill (for registered customer)
      if ((tabIndex === 0 && selectedCustomer) || (tabIndex === 1 && customerIdForBill)) {
        try {
          const res = await axios.get(paymentsApi, { params: { customerId: selectedCustomer || customerIdForBill } });
          const payments = Array.isArray(res.data) ? res.data : [];
          const remaining = payments.reduce((sum: number, p: any) => sum + (Number(p.remainingAmount ?? p.deupayment ?? 0) || 0), 0);
          setRemainingBalance(remaining);
        } catch (err) {
          console.error('Error refreshing remaining balance:', err);
        }
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        alert('Failed to save bill: ' + error.response.data.error);
      } else {
        alert('Error saving bill: ' + error.message);
      }
      console.error('Error details:', error);
    }
  };

  const handlePrint = () => window.print();

  // Filter stock data based on selected brand
  const filteredStockData = brand 
    ? stockData.filter(item => item.brand === brand)
    : stockData;

  // Get unique brands for stock display
  const uniqueBrands = React.useMemo(() => {
    const brands = new Set(stockData.map(item => item.brand));
    return Array.from(brands);
  }, [stockData]);

  // Sort stockData by brand name alphabetically for display
  const sortedStockData = [...stockData].sort((a, b) => a.brand.localeCompare(b.brand));

  return (
    <AdminLayout>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Left Side - Invoice Form */}
        <div className="card billing-card" style={{ flex: 3 }}>
          <div style={{textAlign: 'center', fontSize: 'x-large', fontWeight: 'bold', color: '#0d4483', fontFamily: "'Times New Roman', Times, serif"}}>
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
                    {filteredCustomers.map((c) => (
                      <li key={c._id} onClick={() => {
                        setSelectedCustomer(c._id);
                        setCustomerSearch(c.customername);
                      }}>
                        {c.customername} ({c.phone})
                      </li>
                    ))}
                    {filteredCustomers.length === 0 && <li>No matches found</li>}
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

            {/* Brand Selector - Updated to match other dropdown styles and centered */}
            <div className="bottle-row" style={{ justifyContent: 'center' }}>
              <select 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)}
                required
               
              >
                <option value="">Select Brand</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <h3>Bottle Details</h3>
            {bottles.map((item, idx) => (
              <div key={idx} className="bottle-row">
                <select 
                  value={item.type} 
                  onChange={(e) => handleBottleChange(idx, 'type', e.target.value)} 
                  required
                  disabled={!brand}
                >
                  <option value="">Select Bottle Size</option>
                  {bottleSizes.map(size => <option key={size} value={size}>{size} (Stock: {
                    stockData.find(s => s.brand === brand && s.bottleSize === size)?.quantity || 0
                  })</option>)}
                </select>
                <label>Qty:
                  <input type="number" min={1} value={item.quantity}
                    onChange={(e) => handleBottleChange(idx, 'quantity', e.target.value)} required />
                </label>
                <label>Price:
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.price}
                    onChange={(e) => handleBottleChange(idx, 'price', e.target.value)}
                    required
                  />
                </label>
                <button type="button" className='delete-button' onClick={() => handleDeleteBottle(idx)}>🗑</button>
                {idx === bottles.length - 1 && (
                  <button type="button" className='add-button' onClick={handleAddBottle}>➕</button>
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
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit">Credit</option>
                </select>
              </label>
            </div>

            {/* Remaining Balance for registered customers when paying by Cash (styled like other amount fields) */}
            {tabIndex === 0 && selectedCustomer && paymentMethod === 'cash' && (
              <div className="amount" style={{ marginTop: '1rem' }}>
                <label>
                  Remaining Balance:
                  <input
                    type="text"
                    value={remainingBalance.toFixed(2)}
                    readOnly
                  />
                </label>
              </div>
            )}

            {['cheque'].includes(paymentMethod) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              
              {/* Remaining Balance (for registered customers) - displayed above Cheque No */}
              {tabIndex === 0 && selectedCustomer && (
                <div className="amount">
                  <label>
                    Remaining Balance:
                    <input
                      type="text"
                      value={remainingBalance.toFixed(2)}
                      readOnly
                    />
                  </label>
                </div>
              )}

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
                  <input
                    type="text"
                    value={calculateTotal().toFixed(2)}
                    readOnly
                  />
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
        {['credit'].includes(paymentMethod) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {/* Remaining Balance (for registered customers) - same style as other amount fields */}
              {tabIndex === 0 && selectedCustomer && (
                <div className="amount">
                  <label>
                    Remaining Balance:
                    <input
                      type="text"
                      value={remainingBalance.toFixed(2)}
                      readOnly
                    />
                  </label>
                </div>
              )}
              <div className="amount">
                <label>
                  Total Amount:
                  <input
                    type="text"
                    value={calculateTotal().toFixed(2)}
                    readOnly
                  />
                </label>
              </div>
              <div className="amount">
                <label>
                  Paid Amount:
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    required
                  />
                </label>
              </div>
              <div className="amount">
                <label>
                  Credit Amount:
                  <input
                    type="text"
                    value={creditAmount.toFixed(2)}
                    readOnly
                  />
                </label>
              </div>
            </div>
          )}
          </div>

          <button type="submit" className="button-submit">Submit Bill</button>
        </form>

          {success && lastBill && (
            <>
              <InvoicePreview
                ref={printRef}
                customerName={lastBill.customerName}
                customerPhone={lastBill.customerPhone}
                paymentMethod={lastBill.paymentMethod}
                bottles={lastBill.bottles}
                date={lastBill.date}
                bankName={lastBill.bankName}
                chequeStatus={lastBill.chequeStatus}
                creditLimit={lastBill.creditLimit}
                dueDate={lastBill.dueDate}
              />
              <button onClick={handlePrint}>Print</button>
            </>
          )}
        </div>
        
        {/* Right Side - Stock Table */}
        <div style={{ flex: 1, marginTop: '2rem' }}>
          <h3>Current Stock</h3>
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
                {sortedStockData.length > 0 ? (
                  sortedStockData.map((row, index) => (
                    <TableRow key={`stock-${index}`}>
                      <TableCell>{row.brand}</TableCell>
                      <TableCell>{row.bottleSize}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No stock data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

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
        .brand-select {
          margin-bottom: 1rem;
        }
      `}</style>
    </AdminLayout>
  );
};

export default Billing;