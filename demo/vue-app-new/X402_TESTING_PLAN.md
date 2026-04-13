# x402 Testing Plan

## Goal

Validate the end-to-end x402 payment flow used by the Vue demo against the local x402 test server.

Success means:

- protected endpoints return a payment challenge when no payment is attached
- a funded Base Sepolia wallet can complete the paid retry successfully
- `X402Tester` writes results and errors to the shared dashboard UI console
- common failure modes are easy to reproduce and diagnose

## Scope

This plan covers the main x402 demo path across:

- `demo/vue-app-new/src/components/X402Tester.vue`
- `demo/vue-app-new/src/components/AppDashboard.vue`
- `demo/x402-test-server/src/index.ts`
- the `useX402Fetch` flow exposed through `@web3auth/modal/x402/vue`

It does not try to fully validate every wallet provider or every facilitator implementation.

## Test Environment

### Backend

Start the local x402 server:

```bash
cd demo/x402-test-server
cp .env.example .env
# Set EVM_ADDRESS and SVM_ADDRESS
npm install
npm run dev
```

Expected default server URL:

```text
http://localhost:4021
```

### Frontend

Start the Vue demo and point it at the local server:

```bash
cd demo/vue-app-new
cp .env.sample .env
```

Set at least:

```bash
VITE_APP_X402_TEST_CONTENT_URL=http://localhost:4021/weather
```

Then run:

```bash
npm install
npm run dev
```

## Preconditions

- Web3Auth login is working in the Vue demo
- an EVM wallet is connected
- the wallet can switch to Base Sepolia (`0x14a34`)
- the wallet has enough Base Sepolia gas
- the wallet has enough Base Sepolia USDC for micro-payments

## Endpoints Under Test

| Method | Path | Expected behavior |
| ------ | ---- | ----------------- |
| `GET` | `/health` | Free health check |
| `GET` | `/weather` | Standard paid x402 route |
| `GET` | `/premium-data` | Paid route with higher price |
| `GET` | `/weather-plain` | Debug-friendly route that returns payment requirements in the body when unpaid |

## Manual Test Cases

| ID | Scenario | Steps | Expected result |
| -- | -------- | ----- | --------------- |
| `X402-01` | Server health | Call `GET /health` in a browser or with `curl` | `200 OK` with JSON status payload |
| `X402-02` | Unpaid challenge for `/weather` | Call `GET /weather` without payment headers | `402 Payment Required` and x402 payment requirements |
| `X402-03` | Successful paid fetch for `/weather` in Vue UI | Log in, connect wallet, switch to Base Sepolia, keep the tester URL on `/weather`, and press `Fetch with Payment` | shared UI console shows `x402 response`, `status: 200`, and a weather payload in `body` |
| `X402-04` | Successful paid fetch for `/premium-data` in Vue UI | Change the tester URL to `/premium-data` and press `Fetch with Payment` | shared UI console shows `x402 response`, `status: 200`, and premium dataset JSON |
| `X402-05` | Debug route without payment | Call `GET /weather-plain` without payment headers | `402` body includes `accepts` array and resource metadata |
| `X402-06` | Debug route through Vue UI | Set the tester URL to `/weather-plain` and press `Fetch with Payment` | shared UI console shows `x402 response`, `status: 200`, and the weather payload |
| `X402-07` | Wrong-network recovery | Open the Vue demo while connected to an EVM chain other than Base Sepolia | tester shows `Not on Base Sepolia`; after pressing `Switch to Base Sepolia`, the badge updates and fetch can be retried |
| `X402-08` | Insufficient balance failure | Use a wallet without enough USDC or gas and attempt `Fetch with Payment` | fetch fails cleanly; UI console shows an actionable error or a 402-style response that can be inspected |

## Focus Areas During Testing

### UI behavior

- the `Fetch with Payment` button is disabled when no wallet is connected
- loading state is shown while the request is in flight
- results are printed in the dashboard console, not inline inside `X402Tester`
- errors are also routed to the dashboard console

### Payment behavior

- unpaid requests are challenged instead of silently failing
- paid retries use the connected wallet on Base Sepolia
- the same URL can be retested multiple times without refreshing the page
- successful payments return the protected resource body

### Debuggability

- `/weather-plain` remains available as a browser-friendly inspection route
- server logs are sufficient to distinguish challenge, retry, and settlement failures
- console output includes enough context to see which URL was tested and whether the response was successful

## Suggested cURL Checks

Use these checks before testing the Vue flow:

```bash
curl -i http://localhost:4021/health
curl -i http://localhost:4021/weather
curl -i http://localhost:4021/weather-plain
curl -i http://localhost:4021/premium-data
```

Expected outcomes:

- `/health` returns `200`
- paid routes return `402` when no payment is attached
- `/weather-plain` returns a readable JSON challenge body

## Failure Cases To Watch

Common issues worth validating explicitly:

- wallet is connected, but not on Base Sepolia
- wallet has insufficient USDC for the requested payment
- wallet has insufficient gas to complete the transaction
- a stale or expired payment proof is retried
- the configured tester URL points to the wrong server or port
- the frontend shows no result because console output wiring regressed

## Exit Criteria

The testing cycle is complete when:

- `X402-01` through `X402-06` pass
- at least one negative case from `X402-07` or `X402-08` is exercised
- success and failure states are both visible in the dashboard console
- no inline result panel is required to inspect x402 responses
