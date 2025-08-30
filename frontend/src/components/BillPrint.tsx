import React, { forwardRef } from 'react';
import '../styles/Invoice.css';

interface BottleEntry {
  type: string;
  quantity: number;
  price: number;
  brand?: string; // Add brand as optional field
}

interface InvoiceProps {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  bankName: string | undefined;
  chequeStatus: string | undefined;
  creditLimit: number | undefined;
  dueDate: string | undefined;
  bottles: BottleEntry[];
  date: string;
  brand?: string; // Add brand as optional field
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoiceProps>(
  (
    {
      customerName,
      customerPhone,
      paymentMethod,
      bottles,
      date,
      bankName,
      chequeStatus,
      creditLimit,
      dueDate,
      brand, // Include brand in destructuring
    },
    ref
  ) => {
    const total = bottles.reduce((sum, b) => sum + b.quantity * b.price, 0);

    return (
      // constrain width and center the invoice
      <div className="invoice-wrapper" ref={ref} style={{ margin: '0 auto', width: '100%', maxWidth: 800 }}>
          <div className="invoice-logo-wrapper">
            <img src="logo.png" alt="Company Logo" className="invoice-logo" />
          </div>
        <header className="invoice-header">
          <h1>INVOICE</h1>
          <span>No: INV-2025-01</span>
        </header>

        <div className="invoice-top">
          <div>
            <h3>Bill To:</h3>
            <p>{customerName}</p>
            <p>{customerPhone}</p>
            <p>Alwon Water Treatment</p>
          </div>
          <div>
            <h3>From:</h3>
            <p>Alwon Admin</p>
            <p>0712345678</p>
            <p>alwon.lk</p>
          </div>
        </div>

        <p className="invoice-date">Date: {date}</p>
        {brand && <p className="invoice-brand">Brand: {brand}</p>}

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {bottles.map((b, i) => (
              <tr key={i}>
                <td>{b.type} Bottle {b.brand && `(${b.brand})`}</td>
                <td>{b.quantity}</td>
                <td>Rs. {b.price.toFixed(2)}</td>
                <td>Rs. {(b.quantity * b.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="subtotal-line">
          <span>Sub Total</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>

        <div className="invoice-footer">
          <div className="note-section">
            <p><strong>Note:</strong></p>
            <p>Thank you for your purchase!</p>
          </div>
          <div className="payment-section">
            <p><strong>Payment Method:</strong> {paymentMethod}</p>
            <p><strong>Bank:</strong> Alwon Bank</p>
            <p><strong>Email:</strong> support@alwon.lk</p>
          </div>
        </div>

        <div className="thankyou">Thank You!</div>
      </div>
    );
  }
);

export default InvoicePreview;
