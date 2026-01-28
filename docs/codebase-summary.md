# Web3Auth Web SDK - Codebase Summary

## Repository Structure

```
web3auth-web/
├── packages/                    # Main packages (Lerna monorepo)
│   ├── modal/                   # @web3auth/modal - Full SDK with UI
│   │   ├── src/
│   │   │   ├── index.ts         # Package entry point
│   │   │   ├── modalManager.ts  # Web3Auth class (extends Web3AuthNoModal)
│   │   │   ├── config.ts        # Default configurations
│   │   │   ├── interface.ts     # TypeScript interfaces
│   │   │   ├── connectors/      # Modal-specific connectors
│   │   │   ├── providers/       # Modal-specific providers (MPC, XRPL)
│   │   │   ├── react/           # React hooks and provider
│   │   │   ├── vue/             # Vue composables and provider
│   │   │   └── ui/              # Login modal UI components
│   │   └── dist/                # Built output (ESM, CJS, UMD)
│   │
│   └── no-modal/                # @web3auth/no-modal - Core SDK
│       ├── src/
│       │   ├── index.ts         # Package entry point
│       │   ├── noModal.ts       # Web3AuthNoModal class (core)
│       │   ├── base/            # Base classes, interfaces, utilities
│       │   ├── connectors/      # Wallet connectors
│       │   ├── providers/       # Blockchain providers
│       │   ├── plugins/         # Plugin system
│       │   ├── react/           # React hooks and provider
│       │   └── vue/             # Vue composables and provider
│       └── dist/                # Built output
│
├── demo/                        # Example applications
│   ├── nextjs-ssr-app/          # Next.js SSR example
│   ├── react-app-no-modal/      # React with no-modal SDK
│   ├── vite-react-app-sfa/      # Vite React with SFA
│   ├── vite-react-app-solana/   # Vite React with Solana
│   ├── vue-app-new/             # Vue 3 example
│   └── wagmi-react-app/         # React with Wagmi integration
│
├── scripts/                     # Build and utility scripts
│   ├── create-final-registry.js
│   ├── download-img.js
│   └── wallet-registry-*.json   # Wallet registry data
│
├── locales/                     # i18n localization
│   └── importLocales.mjs
│
├── test/                        # Test configuration
├── lerna.json                   # Lerna configuration
├── package.json                 # Root package.json
└── tsconfig.json                # TypeScript configuration
```

## Package Details

### @web3auth/modal (packages/modal/)

The full-featured SDK with a pre-built login modal UI.

**Source Structure:**
```
src/
├── index.ts                     # Exports all public APIs
├── modalManager.ts              # Web3Auth class (main entry)
├── config.ts                    # Default connector configurations
├── interface.ts                 # Modal-specific interfaces
├── utils.ts                     # Utility functions
│
├── connectors/
│   └── coinbase-connector/      # Coinbase Wallet connector
│
├── providers/
│   ├── ethereum-mpc-provider/   # MPC signing for Ethereum
│   └── xrpl-provider/           # XRP Ledger provider
│
├── react/
│   ├── index.ts                 # React exports
│   ├── Web3AuthProvider.ts      # Context provider
│   ├── interfaces.ts            # React-specific types
│   ├── context/                 # React contexts
│   ├── hooks/                   # React hooks (18 hooks)
│   │   ├── useWeb3Auth.ts
│   │   ├── useWeb3AuthConnect.ts
│   │   ├── useWeb3AuthDisconnect.ts
│   │   ├── useWeb3AuthUser.ts
│   │   ├── useChain.ts
│   │   ├── useSwitchChain.ts
│   │   ├── useEnableMFA.ts
│   │   └── ... (more hooks)
│   ├── solana/                  # Solana-specific hooks
│   └── wagmi/                   # Wagmi adapter
│
├── vue/
│   ├── index.ts                 # Vue exports
│   ├── Web3AuthProvider.ts      # Vue provide/inject
│   ├── composables/             # Vue composables (18 composables)
│   ├── solana/                  # Solana-specific composables
│   └── wagmi/                   # Wagmi adapter for Vue
│
└── ui/
    ├── index.ts                 # UI exports
    ├── loginModal.tsx           # Main modal component
    ├── config.ts                # UI configuration
    ├── constants.ts             # UI constants
    ├── interfaces.ts            # UI interfaces
    ├── components/              # React UI components
    │   ├── Button/
    │   ├── Modal/
    │   ├── Login/
    │   ├── ConnectWallet/
    │   └── ... (more components)
    ├── context/                 # UI contexts
    ├── handlers/                # Event handlers
    ├── css/                     # Styles (Tailwind)
    └── i18n/                    # Translations (11 languages)
```

### @web3auth/no-modal (packages/no-modal/)

The core SDK without UI, providing maximum flexibility.

**Source Structure:**
```
src/
├── index.ts                     # Package entry
├── noModal.ts                   # Web3AuthNoModal class
│
├── base/                        # Core foundations
│   ├── index.ts
│   ├── analytics.ts             # Analytics integration
│   ├── constants.ts             # SDK constants
│   ├── cookie.ts                # Cookie storage
│   ├── deserialize.ts           # State deserialization
│   ├── interfaces.ts            # Core interfaces
│   ├── loglevel.ts              # Logging setup
│   ├── utils.ts                 # Utility functions
│   ├── chain/
│   │   └── IChainInterface.ts   # Chain configuration types
│   ├── connector/               # Connector base classes
│   │   ├── baseConnector.ts
│   │   ├── interfaces.ts
│   │   └── constants.ts
│   ├── core/
│   │   └── IWeb3Auth.ts         # Core Web3Auth interface
│   ├── errors/                  # Error definitions
│   ├── plugin/                  # Plugin system interfaces
│   ├── provider/
│   │   └── IProvider.ts         # Provider interface
│   ├── hooks/                   # Shared hook utilities
│   ├── composables/             # Shared composable utilities
│   └── wallet/                  # Wallet constants
│
├── connectors/                  # Wallet connectors
│   ├── index.ts
│   ├── auth-connector/          # Web3Auth native auth
│   ├── base-evm-connector/      # Base EVM connector
│   ├── base-solana-connector/   # Base Solana connector
│   ├── injected-evm-connector/  # EVM injected wallets (MIPD)
│   ├── injected-solana-connector/ # Solana wallet standard
│   ├── metamask-connector/      # MetaMask SDK integration
│   ├── coinbase-connector/      # Coinbase wallet
│   └── wallet-connect-v2-connector/ # WalletConnect v2
│
├── providers/                   # Blockchain providers
│   ├── index.ts
│   ├── base-provider/           # Base provider class
│   │   ├── baseProvider.ts
│   │   ├── CommonJRPCProvider.ts
│   │   └── commonPrivateKeyProvider.ts
│   ├── account-abstraction-provider/ # ERC-4337 support
│   │   ├── providers/
│   │   │   ├── AccountAbstractionProvider.ts
│   │   │   └── smartAccounts/
│   │   └── rpc/
│   ├── ethereum-provider/       # Ethereum provider
│   │   ├── providers/
│   │   │   └── privateKeyProviders/
│   │   └── rpc/
│   ├── ethereum-mpc-provider/   # MPC Ethereum provider
│   │   ├── providers/
│   │   │   └── signingProviders/
│   │   └── rpc/
│   ├── solana-provider/         # Solana provider
│   │   ├── solanaWallet.ts
│   │   ├── providers/
│   │   │   └── injectedProviders/
│   │   └── rpc/
│   └── xrpl-provider/           # XRP Ledger provider
│
├── plugins/                     # Plugin implementations
│   ├── index.ts
│   └── wallet-services-plugin/  # Wallet services (portfolio, etc.)
│
├── react/                       # React integration
│   ├── index.ts
│   ├── Web3AuthProvider.ts
│   ├── interfaces.ts
│   ├── context/
│   ├── hooks/
│   ├── solana/
│   └── wagmi/
│
└── vue/                         # Vue integration
    ├── index.ts
    ├── Web3AuthProvider.ts
    ├── composables/
    ├── solana/
    └── wagmi/
```

## Key Files

### Entry Points

| File | Purpose |
|------|---------|
| `packages/modal/src/index.ts` | Modal SDK exports |
| `packages/no-modal/src/index.ts` | No-modal SDK exports |
| `packages/modal/src/modalManager.ts` | `Web3Auth` class |
| `packages/no-modal/src/noModal.ts` | `Web3AuthNoModal` class |

### Core Classes

| Class | File | Description |
|-------|------|-------------|
| `Web3Auth` | `modalManager.ts` | Main modal SDK class |
| `Web3AuthNoModal` | `noModal.ts` | Core SDK class |
| `LoginModal` | `ui/loginModal.tsx` | Modal UI component |
| `CommonJRPCProvider` | `providers/base-provider/` | Universal JRPC provider |

### Important Interfaces

| Interface | File | Description |
|-----------|------|-------------|
| `IWeb3Auth` | `base/core/IWeb3Auth.ts` | Core SDK interface |
| `IConnector` | `base/connector/interfaces.ts` | Connector interface |
| `IProvider` | `base/provider/IProvider.ts` | Provider interface |
| `IPlugin` | `base/plugin/IPlugin.ts` | Plugin interface |
| `CustomChainConfig` | `base/chain/IChainInterface.ts` | Chain configuration |

## File Count Summary

| Directory | TypeScript Files | Purpose |
|-----------|------------------|---------|
| `packages/modal/src/` | ~111 files | Modal SDK source |
| `packages/no-modal/src/` | ~180 files | Core SDK source |
| `demo/` | ~50 files | Example applications |

## Build Outputs

Each package produces:
- `dist/lib.esm/` - ES Module build
- `dist/lib.cjs/` - CommonJS build
- `dist/*.umd.min.js` - UMD bundle for browsers
- `dist/lib.cjs/types/` - TypeScript declarations

## Dependencies Graph

```
@web3auth/modal
    └── @web3auth/no-modal
        ├── @web3auth/auth (core auth service)
        ├── @toruslabs/base-controllers
        ├── @toruslabs/ethereum-controllers
        ├── @walletconnect/sign-client
        ├── @metamask/sdk
        ├── ethers
        ├── @solana/web3.js
        └── xrpl
```

## Module System

- **Package Manager:** npm with workspaces
- **Monorepo Tool:** Lerna v9
- **Module Formats:** ESM, CJS, UMD
- **TypeScript:** ~5.9.3 with path transforms

## Export Paths

### @web3auth/modal
```javascript
import { Web3Auth } from "@web3auth/modal";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useWeb3Auth } from "@web3auth/modal/vue";
import { useWeb3Auth } from "@web3auth/modal/react/solana";
import { useWeb3Auth } from "@web3auth/modal/react/wagmi";
```

### @web3auth/no-modal
```javascript
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { useWeb3Auth } from "@web3auth/no-modal/react";
import { useWeb3Auth } from "@web3auth/no-modal/vue";
```
