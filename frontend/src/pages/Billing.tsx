import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import '../styles/theme.css';
import { Tabs, Tab, Box } from '@mui/material';
import InvoicePreview from '../components/BillPrint';

const customers = [
  { id: 1, name: 'John Doe', phone: '0711234567' },
  { id: 2, name: 'Jane Smith', phone: '0727654321' }
];

const bottleSizes = ['500ml', '1L', '5L', '20L'];

type BottleKey = 'type' | 'quantity' | 'price';

const Billing: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0: Registered, 1: Guest
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bottles, setBottles] = useState([{ type: '', quantity: 1, price: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [success, setSuccess] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
    const [creditAmount, setCreditAmount] = useState(0); // ← added

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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setSelectedCustomer(null);
    setGuestName('');
    setGuestPhone('');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const customerName = tabIndex === 0
    ? customers.find(c => c.id === selectedCustomer)?.name || ''
    : guestName;

  const customerPhone = tabIndex === 0
    ? customers.find(c => c.id === selectedCustomer)?.phone || ''
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const billData = {
      customerName,
      customerPhone,
      paymentMethod,
      bottles,
      amount: calculateTotal(),          // Total amount of the bill
      paidAmount: paymentMethod === 'credit' ? paidAmount : calculateTotal(),
      creditAmount: paymentMethod === 'credit' ? creditAmount : 0,
      remainingAmount: paymentMethod !== 'cash' ? remainingAmount : 0,
      chequeNo: paymentMethod === 'cheque' ? chequeNo : '',
      chequeDate: paymentMethod === 'cheque' ? chequeDate : '',
    };

    console.log('Bill Data to Save:', billData);
    setSuccess(true);
  };

  const handlePrint = () => window.print();

  return (
    <AdminLayout>
      <div className="card billing-card">
        <h1>Invoice</h1>

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
                    <li key={c.id} onClick={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch(c.name);
                    }}>
                      {c.name} ({c.phone})
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

          <h3>Bottle Details</h3>
          {bottles.map((item, idx) => (
            <div key={idx} className="bottle-row">
              <select value={item.type} onChange={(e) => handleBottleChange(idx, 'type', e.target.value)} required>
                <option value="">Select Bottle Size</option>
                {bottleSizes.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
              <label>Qty:
                <input type="number" min={1} value={item.quantity}
                  onChange={(e) => handleBottleChange(idx, 'quantity', e.target.value)} required />
              </label>
              <label>Price:
                <input type="number" min={0} step={0.01} value={item.price}
                  onChange={(e) => handleBottleChange(idx, 'price', e.target.value)} required />
              </label>
              <button type="button" className='delete-button' onClick={() => handleDeleteBottle(idx)}>🗑</button>
              {idx === bottles.length - 1 && (
                <button type="button" className='add-button'onClick={handleAddBottle}>➕</button>
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

            {['cheque'].includes(paymentMethod) && (
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
                  />
                </label>
              </div>

              <div className="amount">
                <label>
                  Amount:
                  <input
                    type="text"
                    value={calculateTotal().toFixed(2)}
                    onChange={(e) => setChequeNo(e.target.value)} // ← this line might be a mistake
                  />
                </label>
              </div>

              <div className="date">
                <label>
                  Date:
                  <input
                    type="text"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
        {['credit'].includes(paymentMethod) && (
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
                    type="text"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                  />
                </label>
              </div>
              <div className="amount">
                <label>
                  Credit Amount:
                  <input
                    type="text"
                    value={creditAmount}
                    readOnly
                  />
                </label>
              </div>


            </div>
          )}
          </div>



          <button type="submit" className="button-submit">Submit Bill</button>
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
