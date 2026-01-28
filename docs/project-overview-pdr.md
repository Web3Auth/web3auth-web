# Web3Auth Web SDK - Project Overview & PDR

## Project Overview

**Name:** web3auth-web  
**Version:** 10.13.1  
**Author:** Torus Labs  
**Repository:** [github.com/Web3Auth/Web3Auth](https://github.com/Web3Auth/Web3Auth)

### Description

Web3Auth is a pluggable authentication infrastructure for Web3 wallets and applications. It combines passwordless authentication with non-custodial key infrastructure, providing seamless login experiences for blockchain applications.

The SDK aggregates multiple authentication methods:
- **OAuth Providers:** Google, Twitter, Discord, Apple, GitHub, LinkedIn, etc.
- **Passwordless:** Email and SMS magic links
- **External Wallets:** MetaMask, WalletConnect, Coinbase, and other injected wallets

### Core Value Proposition

1. **User Experience:** One-click login for Web3 apps using familiar OAuth providers
2. **Security:** Non-custodial key management using threshold cryptography (MPC)
3. **Developer Experience:** Simple SDK integration with React/Vue hooks and vanilla JS support
4. **Multi-chain Support:** EVM chains, Solana, XRPL, and custom chain namespaces

---

## Product Development Requirements (PDR)

### Target Users

1. **dApp Developers:** Building Web3 applications that need user authentication
2. **Wallet Developers:** Integrating social login into wallet products
3. **Enterprise Teams:** Requiring whitelabel authentication solutions

### Functional Requirements

#### Authentication

| Requirement | Description | Status |
|-------------|-------------|--------|
| FR-1 | OAuth 2.0 social login (Google, Twitter, Discord, etc.) | ✅ Implemented |
| FR-2 | Email/SMS passwordless login | ✅ Implemented |
| FR-3 | External wallet connection (MetaMask, WalletConnect) | ✅ Implemented |
| FR-4 | Multi-Factor Authentication (MFA) setup and recovery | ✅ Implemented |
| FR-5 | Session management with configurable expiry | ✅ Implemented |

#### Key Management

| Requirement | Description | Status |
|-------------|-------------|--------|
| FR-6 | Non-custodial key generation via MPC | ✅ Implemented |
| FR-7 | Key reconstruction using threshold cryptography | ✅ Implemented |
| FR-8 | Private key export (optional, configurable) | ✅ Implemented |
| FR-9 | Account abstraction / smart accounts support | ✅ Implemented |

#### Multi-chain Support

| Requirement | Description | Status |
|-------------|-------------|--------|
| FR-10 | EVM-compatible chains (Ethereum, Polygon, BSC, etc.) | ✅ Implemented |
| FR-11 | Solana blockchain support | ✅ Implemented |
| FR-12 | XRP Ledger (XRPL) support | ✅ Implemented |
| FR-13 | Dynamic chain switching | ✅ Implemented |

#### UI/UX

| Requirement | Description | Status |
|-------------|-------------|--------|
| FR-14 | Pre-built login modal UI | ✅ Implemented |
| FR-15 | Whitelabel customization (colors, logos, themes) | ✅ Implemented |
| FR-16 | i18n/localization support | ✅ Implemented |
| FR-17 | Responsive design (mobile/desktop) | ✅ Implemented |

### Non-Functional Requirements

| Requirement | Description | Target |
|-------------|-------------|--------|
| NFR-1 | Bundle size optimization | UMD < 500KB minified |
| NFR-2 | Browser compatibility | Modern browsers (Chrome, Firefox, Safari, Edge) |
| NFR-3 | Tree-shakeable exports | ESM with proper exports |
| NFR-4 | TypeScript support | Full type definitions |
| NFR-5 | Framework agnostic | Works with React, Vue, vanilla JS |
| NFR-6 | SSR compatibility | Next.js SSR support |

### Packages

| Package | npm | Description |
|---------|-----|-------------|
| `@web3auth/modal` | ![npm](https://img.shields.io/npm/v/@web3auth/modal) | Full SDK with pre-built modal UI |
| `@web3auth/no-modal` | ![npm](https://img.shields.io/npm/v/@web3auth/no-modal) | Core SDK without UI (headless) |

### Dependencies

#### Core Dependencies
- `@web3auth/auth`: Core authentication service
- `@toruslabs/base-controllers`: State management controllers
- `@toruslabs/ethereum-controllers`: Ethereum-specific controllers
- `ethers`: Ethereum utilities
- `@solana/web3.js`: Solana blockchain client
- `@walletconnect/sign-client`: WalletConnect v2 integration

#### Framework Integrations
- React 18+ with hooks
- Vue 3+ with composables
- Wagmi integration for EVM chains
- Solana wallet adapter compatibility

---

## Roadmap Considerations

### Future Enhancements

1. **Additional Chains:** Support for more blockchain ecosystems
2. **Enhanced MPC:** Improved key recovery mechanisms
3. **Analytics Dashboard:** User authentication metrics
4. **Passkey Support:** WebAuthn/FIDO2 integration
5. **Embedded Wallet Improvements:** In-app transaction signing UX

### Known Limitations

1. Requires `@babel/runtime` as peer dependency
2. Node 20+ required for development
3. Some features require Web3Auth dashboard configuration
4. Account abstraction requires bundler/paymaster configuration

---

## Getting Started

### Prerequisites

1. Register at [Web3Auth Dashboard](https://dashboard.web3auth.io/)
2. Create a project and obtain `clientId`
3. Configure authentication methods in dashboard

### Installation

```bash
# Full SDK with modal
npm install @web3auth/modal

# Headless SDK
npm install @web3auth/no-modal
```

### Quick Start (React)

```tsx
import { Web3AuthProvider, useWeb3AuthConnect } from "@web3auth/modal/react";

const config = {
  web3AuthOptions: {
    clientId: "YOUR_CLIENT_ID",
    web3AuthNetwork: "sapphire_mainnet",
  },
};

// Wrap your app
<Web3AuthProvider config={config}>
  <App />
</Web3AuthProvider>

// Use hooks
function App() {
  const { connect, isConnected } = useWeb3AuthConnect();
  return <button onClick={() => connect()}>Login</button>;
}
```

---

## Documentation Links

- [Official Documentation](https://web3auth.io/docs)
- [SDK Reference](https://web3auth.io/docs/sdk/web/)
- [Examples Repository](https://github.com/Web3Auth/web3auth-examples/)
- [Community Portal](https://community.web3auth.io/)
