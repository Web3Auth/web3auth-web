# x402-test-server

A minimal Express server that demonstrates the [x402 payment protocol](https://x402.org) middleware. It is the backend target used by the `wagmi-react-app` demo's `useX402Fetch` hook.

## Endpoints

| Method | Path             | Price       | Description                                    |
| ------ | ---------------- | ----------- | ---------------------------------------------- |
| GET    | `/health`        | Free        | Health check — always returns 200              |
| GET    | `/weather-plain` | $0.001 USDC | Plain-text weather (used by the wagmi demo UI) |
| GET    | `/weather`       | $0.001 USDC | JSON weather report                            |
| GET    | `/premium-data`  | $0.010 USDC | Higher-priced premium JSON dataset             |

All paid endpoints require payment on **Base Sepolia** (`eip155:84532`).

## Setup

```bash
cd demo/x402-test-server
cp .env.example .env
# Edit .env and set EVM_ADDRESS to your wallet address
npm install
```

## Running

```bash
# Development (ts-node, no build step)
npm run dev

# Production
npm run build
npm start
```

The server listens on `http://localhost:4021` by default — the same port hardcoded in `demo/wagmi-react-app/src/components/X402.tsx`.

## Environment variables

| Variable          | Required | Default                        | Description                                |
| ----------------- | -------- | ------------------------------ | ------------------------------------------ |
| `EVM_ADDRESS`     | ✅       | —                              | Wallet address that receives USDC payments |
| `SVM_ADDRESS`     | ✅       | —                              | Wallet address that receives on solana     |
| `FACILITATOR_URL` | ❌       | `https://x402.org/facilitator` | x402 facilitator endpoint                  |
| `PORT`            | ❌       | `4021`                         | HTTP listen port                           |

## How it works

1. `paymentMiddleware` from `@x402/express` intercepts every request to a protected route.
2. If no valid `X-PAYMENT` header is present, the middleware responds with **HTTP 402** and a JSON body containing payment instructions.
3. The `useX402Fetch` hook in the React demo signs a micro-payment with the connected wallet and retries the request with the payment header attached.
4. The facilitator verifies the payment on-chain and the server delivers the protected resource.
