import React, { useState } from 'react';
import './Checkout.css';

export default function Checkout() {
  const [method, setMethod] = useState('card'); // Toggle between 'card' and 'upi'
  const [status, setStatus] = useState('idle'); // idle, processing, success
  const [paymentId, setPaymentId] = useState('');
  
  const orderId = new URLSearchParams(window.location.search).get('order_id') || "order_default_123";

const handlePayment = async (e) => {
  e.preventDefault();
  setStatus('processing');

  const payload = {
    order_id: orderId,
    method: method,
    // Backend expects card.number, not just a string
    ...(method === 'card' ? { 
      card: { number: "4111111111111111" } 
    } : { 
      vpa: "test@upi" 
    })
  };

  try {
    const response = await fetch('http://localhost:8000/api/v1/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      setPaymentId(data.id);
      setStatus('success');
    } else {
      setStatus('idle');
      const errData = await response.json();
      alert(`Error: ${errData.error.description}`);
    }
  } catch (error) {
    console.error("Connection failed:", error);
    setStatus('idle');
  }
};

  if (status === 'success') {
    return (
      <div className="checkout-container success-state" data-test-id="success-state">
        <div className="success-icon">✅</div>
        <h2 data-test-id="success-message">Payment Successful!</h2>
        <p>Your transaction has been completed successfully.</p>
        <div className="payment-id-box">
          <strong>Payment ID:</strong> <span data-test-id="payment-id">{paymentId}</span>
        </div>
        <button className="pay-button" style={{width: '100%'}} onClick={() => window.location.href = 'http://localhost:3000'}>
            Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container" data-test-id="checkout-container">
      <div className="order-summary" data-test-id="order-summary" style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
        <h2 style={{margin: '0 0 10px 0'}}>Checkout</h2>
        <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>Order: <span data-test-id="order-id" style={{fontWeight: 'bold'}}>{orderId}</span></p>
        <p style={{margin: '5px 0', fontSize: '18px', fontWeight: 'bold'}}>Total: <span data-test-id="order-amount">₹500.00</span></p>
      </div>

      <div className="method-selector" data-test-id="payment-methods">
        <button 
          className={method === 'card' ? 'active' : ''} 
          onClick={() => setMethod('card')}
          data-test-id="method-card"
        >
          Card
        </button>
        <button 
          className={method === 'upi' ? 'active' : ''} 
          onClick={() => setMethod('upi')}
          data-test-id="method-upi"
        >
          UPI
        </button>
      </div>

      {method === 'card' ? (
        <form className="payment-card" data-test-id="card-form" onSubmit={handlePayment}>
          <div className="input-group">
            <label style={{fontSize: '14px', fontWeight: '600'}}>Card Number</label>
            <input data-test-id="card-number-input" type="text" placeholder="4111 1111 1111 1111" required />
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <div className="input-group" style={{flex: 2}}>
              <label style={{fontSize: '14px', fontWeight: '600'}}>Expiry</label>
              <input data-test-id="expiry-input" type="text" placeholder="MM/YY" required />
            </div>
            <div className="input-group" style={{flex: 1}}>
              <label style={{fontSize: '14px', fontWeight: '600'}}>CVV</label>
              <input data-test-id="cvv-input" type="password" placeholder="123" required />
            </div>
          </div>
          <button className="pay-button" data-test-id="pay-button" type="submit" disabled={status === 'processing'}>
            {status === 'processing' ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      ) : (
        <form className="payment-card" data-test-id="upi-form" onSubmit={handlePayment}>
          <div className="input-group">
            <label style={{fontSize: '14px', fontWeight: '600'}}>UPI ID (VPA)</label>
            <input data-test-id="vpa-input" type="text" placeholder="username@bank" required />
          </div>
          <button className="pay-button" data-test-id="pay-button" type="submit" disabled={status === 'processing'}>
            {status === 'processing' ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      )}

      {status === 'processing' && (
        <div data-test-id="processing-state" style={{marginTop: '20px', textAlign: 'center', color: '#6366f1'}}>
          <span data-test-id="processing-message">Encrypting transaction details...</span>
        </div>
      )}
    </div>
  );
}