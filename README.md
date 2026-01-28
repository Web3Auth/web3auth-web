# Web3Auth

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/modal)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Official Docs](https://web3auth.io/docs) | Complete Web3Auth documentation |
| [SDK Reference](https://web3auth.io/docs/sdk/web/) | API reference and guides |
| [docs/project-overview-pdr.md](./docs/project-overview-pdr.md) | Project overview and requirements |
| [docs/codebase-summary.md](./docs/codebase-summary.md) | Codebase structure and file organization |
| [docs/code-standards.md](./docs/code-standards.md) | Coding standards and conventions |
| [docs/system-architecture.md](./docs/system-architecture.md) | System architecture and design |

## 💡 Features

- Plug and Play, OAuth based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery
- Support for Email and Mobile Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@web3auth/modal` | [![npm](https://img.shields.io/npm/v/@web3auth/modal)](https://www.npmjs.com/package/@web3auth/modal) | Full SDK with pre-built modal UI |
| `@web3auth/no-modal` | [![npm](https://img.shields.io/npm/v/@web3auth/no-modal)](https://www.npmjs.com/package/@web3auth/no-modal) | Core SDK without UI (headless) |

## ⚡ Quick Start

### Installation

```bash
npm install @web3auth/modal
```

### Prerequisites

1. Register on the [Web3Auth Dashboard](https://dashboard.web3auth.io/)
2. Create a project and obtain your `clientId`
3. Configure authentication methods in the dashboard

### React Integration

```tsx
// 1. Configuration (web3authContext.tsx)
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";

const web3AuthOptions: Web3AuthOptions = {
  clientId: "YOUR_CLIENT_ID",
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
};

export const web3AuthContextConfig: Web3AuthContextConfig = { web3AuthOptions };

// 2. Provider Setup (main.tsx)
import { Web3AuthProvider } from "@web3auth/modal/react";
import { web3AuthContextConfig } from "./web3authContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Web3AuthProvider config={web3AuthContextConfig}>
    <App />
  </Web3AuthProvider>
);

// 3. Use Hooks (App.tsx)
import { useWeb3AuthConnect, useWeb3AuthUser } from "@web3auth/modal/react";

function App() {
  const { connect, isConnected } = useWeb3AuthConnect();
  const { user } = useWeb3AuthUser();

  return (
    <button onClick={() => connect()}>
      {isConnected ? `Hello ${user?.name}` : "Connect"}
    </button>
  );
}
```

### Vue Integration

```vue
<!-- App.vue -->
<script setup lang="ts">
import { Web3AuthProvider } from "@web3auth/modal/vue";
import { web3AuthContextConfig } from "./web3authContext";
</script>

<template>
  <Web3AuthProvider :config="web3AuthContextConfig">
    <Home />
  </Web3AuthProvider>
</template>
```

```vue
<!-- Home.vue -->
<script setup lang="ts">
import { useWeb3AuthConnect } from "@web3auth/modal/vue";
const { connect, loading, isConnected } = useWeb3AuthConnect();
</script>

<template>
  <button @click="connect" :disabled="loading || isConnected">
    {{ loading ? "Connecting..." : isConnected ? "Connected" : "Connect" }}
  </button>
</template>
```

### Vanilla JavaScript

```javascript
import { Web3Auth, WEB3AUTH_NETWORK } from "@web3auth/modal";

const web3auth = new Web3Auth({
  clientId: "YOUR_CLIENT_ID",
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
});

await web3auth.init();
await web3auth.connect();

const user = await web3auth.getUserInfo();
console.log(user);
```

## 🔧 Advanced Configuration

```typescript
const web3AuthOptions: Web3AuthOptions = {
  clientId: "YOUR_CLIENT_ID",
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  
  // Chain configuration
  chains: [{
    chainNamespace: "eip155",
    chainId: "0x1",
    rpcTarget: "https://rpc.ankr.com/eth",
    displayName: "Ethereum Mainnet",
    ticker: "ETH",
    tickerName: "Ethereum",
  }],
  
  // Account Abstraction (ERC-4337)
  accountAbstractionConfig: {
    smartAccountType: "safe",
    chains: [{
      chainId: "0x1",
      bundlerConfig: { url: "https://bundler.example.com" },
    }],
  },
  
  // UI Customization
  uiConfig: {
    mode: "dark",
    logoLight: "https://example.com/logo-light.png",
    logoDark: "https://example.com/logo-dark.png",
    primaryColor: "#00a8ff",
  },
};
```

## 🏗️ Project Structure

```
web3auth-web/
├── packages/
│   ├── modal/          # @web3auth/modal - Full SDK with UI
│   │   ├── src/
│   │   │   ├── react/  # React hooks
│   │   │   ├── vue/    # Vue composables
│   │   │   └── ui/     # Modal components
│   │   └── dist/
│   └── no-modal/       # @web3auth/no-modal - Core SDK
│       ├── src/
│       │   ├── connectors/  # Wallet connectors
│       │   ├── providers/   # Blockchain providers
│       │   ├── react/       # React hooks
│       │   └── vue/         # Vue composables
│       └── dist/
├── demo/               # Example applications
└── docs/               # Documentation
```

## 🛠️ Development

### Requirements

- Node.js ≥20.x
- npm ≥9.x

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

### Monorepo Commands

```bash
# Clean all builds
npm run clean

# Publish packages
npm run publish:lerna
```

## 🧳 Bundling

This module is distributed in 3 formats:

| Format | File | Usage |
|--------|------|-------|
| ESM | `dist/lib.esm/` | Modern bundlers (Vite, webpack 5+) |
| CJS | `dist/lib.cjs/` | Node.js, older bundlers |
| UMD | `dist/*.umd.min.js` | Direct browser usage |

### CDN Usage

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@web3auth/modal"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@web3auth/modal"></script>
```

## ⏪ Requirements

- All packages require a peer dependency of `@babel/runtime`
- Node 20+ for development
- React 18+ or Vue 3+ for framework integrations

## 🩹 Examples

Check out the [demo/](./demo/) directory:

| Example | Description |
|---------|-------------|
| `nextjs-ssr-app` | Next.js with SSR |
| `react-app-no-modal` | React without modal UI |
| `vite-react-app-sfa` | Vite + React with SFA |
| `vite-react-app-solana` | Vite + React for Solana |
| `vue-app-new` | Vue 3 application |
| `wagmi-react-app` | React with Wagmi |

More examples at [Web3Auth Examples Repository](https://github.com/Web3Auth/web3auth-examples/).

## 🌐 Demo

Try the [Web3Auth Demo](https://demo.web3auth.io) to see Web3Auth in action.

## 💬 Support

- [Community Portal](https://community.web3auth.io/) - Ask questions and get help
- [Troubleshooting Guide](https://web3auth.io/docs/troubleshooting) - Common issues and solutions
- [Pricing](https://web3auth.io/pricing.html) - Priority support plans

## 📄 License

[ISC](./LICENSE)