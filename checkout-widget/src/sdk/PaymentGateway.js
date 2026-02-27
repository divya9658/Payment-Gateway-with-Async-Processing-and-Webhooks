import './styles.css';

class PaymentGateway {
  constructor(options) {
    this.options = options || {};
    this.init();
  }


  init() {
    console.log('Payment Gateway Initialized', this.options);
  }

  open() {
    const modal = document.createElement('div');
    modal.id = 'payment-gateway-modal';
    modal.dataset.testId = 'payment-modal'; // data-test-id="payment-modal"
    
    // Create inner HTML with required test IDs
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <iframe 
            src="http://localhost:3001/checkout.html?order_id=${this.options.orderId}" 
            style="width: 100%; height: 100%; border: none;"
            data-test-id="payment-iframe"
          ></iframe>
           <button 
            data-test-id="close-modal-button" 
            class="close-button"
            style="position: absolute; top: 10px; right: 10px; cursor: pointer;"
          >
            ×
          </button>
        </div>
      </div>
    `;
    
    // Add Close Listener
    modal.querySelector('.close-button').addEventListener('click', () => this.close());
    
    document.body.appendChild(modal);

    // Add Message Listener for Cross-Origin Communication
    this.messageListener = (event) => {
      if (event.data.type === 'payment_success') {
        if (this.options.onSuccess) this.options.onSuccess(event.data.data);
        this.close();
      } else if (event.data.type === 'payment_failed') {
        if (this.options.onFailure) this.options.onFailure(event.data.data);
      }
    };
    window.addEventListener('message', this.messageListener);
  }
  
  close() {
      const modal = document.getElementById('payment-gateway-modal');
      if(modal) modal.remove();
      
      // Clean up listener
      if (this.messageListener) {
        window.removeEventListener('message', this.messageListener);
      }

      if(this.options.onClose) this.options.onClose();
  }
}

// Expose globally
window.PaymentGateway = PaymentGateway;

export default PaymentGateway;
