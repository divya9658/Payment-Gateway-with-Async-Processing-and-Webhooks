# Payment Gateway System

A production-ready payment gateway system built with Node.js, Express, React, PostgreSQL, and Redis. This system supports asynchronous payment processing, webhooks with retries, refunds, idempotency, and an embeddable checkout SDK.

## Project Structure

```
payment-gatewayy/
├── backend/                # Node.js Express API & Workers
│   ├── src/
│   │   ├── config/         # DB & Redis Config
│   │   ├── controllers/    # API Controllers (Payments, Refunds, Webhooks)
│   │   ├── middleware/     # Auth & Idempotency Middleware
│   │   ├── queues/         # BullMQ Queue Definitions
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Business Logic Services
│   │   ├── utils/          # Helpers (Signature, Enqueue)
│   │   ├── workers/        # Background Job Workers
│   │   └── index.js        # API Entry Point
│   ├── Dockerfile
│   └── package.json
├── checkout-widget/        # Embeddable JS SDK & Iframe
│   ├── src/
│   │   ├── sdk/            # SDK Logic (PaymentGateway.js)
│   │   └── iframe-content/ # React Iframe App
│   ├── Dockerfile
│   └── webpack.config.js
├── database/               # Database Scripts
│   └── init.sql            # Schema Definition & Seeds
├── frontend/               # React Dashboard (Vite)
│   ├── src/
│   │   ├── pages/          # Webhooks & Docs Pages
│   │   └── App.jsx
│   ├── Dockerfile
│   └── vite.config.js
├── test-merchant/          # Simple App to Verify Webhooks
│   └── index.js
└── docker-compose.yml      # Orchestration
```

## Database Schema

### `payments`

Stores proper transaction records.

- `id` (PK): Unique Payment ID (e.g., `pay_...`)
- `merchant_id` (FK): Owner merchant
- `amount`: Amount in usually smallest currency unit
- `status`: `pending`, `success`, `failed`
- `captured`: Boolean (for 2-step auth)

### `refunds`

Tracks full or partial refunds.

- `id` (PK): Unique Refund ID (e.g., `rfnd_...`)
- `payment_id` (FK): Original payment
- `amount`: Refunded amount
- `status`: `pending`, `processed`

### `webhook_logs`

Logs all webhook delivery attempts.

- `id` (PK): Log ID
- `event`: Event type (`payment.success`, `refund.processed`)
- `status`: `pending`, `success`, `failed`
- `attempts`: Retry count (max 5)
- `next_retry_at`: Timestamp for exponential backoff

### `idempotency_keys`

Prevents duplicate operations.

- `key` (PK): Client-provided key
- `response`: Cached JSON response
- `expires_at`: TTL (24 hours)

## Features

1.  **Asynchronous Processing**: Payments and refunds are processed via Redis queues (BullMQ).
2.  **Webhooks**:
    - **HMAC Signatures**: Secure verification using `X-Webhook-Signature`.
    - **Exponential Backoff**: Retries at 1m, 5m, 30m, 2h intervals.
3.  **Idempotency**: Safe-guard against network retries using `Idempotency-Key` header.
4.  **Embeddable SDK**: easy-to-use JS library for merchants.
    ```html
    <script src="http://localhost:3001/checkout.js"></script>
    ```
5.  **Dashboard**: UI to view logs, retry webhooks, and read docs.

## Setup & Run

The entire system is containerized.

1.  **Start Services**:

    ```bash
    docker-compose up -d --build
    ```

2.  **Access Components**:
    - **Dashboard**: http://localhost:3000
    - **API**: http://localhost:8000
    - **Test Merchant**: http://localhost:4000

## API Overview

- `POST /api/v1/payments`: Create a payment
- `POST /api/v1/payments/:id/capture`: Capture a payment
- `POST /api/v1/payments/:id/refunds`: Create a refund
- `GET /api/v1/webhooks`: List webhook logs
- `POST /api/v1/webhooks/:id/retry`: Manually retry a webhook
