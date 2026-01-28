# Web3Auth Web SDK - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Application Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │   React Hooks   │  │ Vue Composables │  │    Vanilla JavaScript       │ │
│  │   (18 hooks)    │  │ (18 composables)│  │    (Web3Auth class)         │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘ │
└───────────┼────────────────────┼────────────────────────┼───────────────────┘
            │                    │                        │
            ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SDK Layer                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    @web3auth/modal                                   │   │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────────┐│   │
│  │  │ LoginModal  │  │  Web3Auth       │  │   UI Components          ││   │
│  │  │ (React UI)  │  │  (extends       │  │   (Tailwind CSS)         ││   │
│  │  │             │  │   NoModal)      │  │                          ││   │
│  │  └─────────────┘  └────────┬────────┘  └──────────────────────────┘│   │
│  └────────────────────────────┼────────────────────────────────────────┘   │
│                               │                                             │
│  ┌────────────────────────────┼────────────────────────────────────────┐   │
│  │                    @web3auth/no-modal                               │   │
│  │  ┌─────────────────────────▼─────────────────────────────────────┐ │   │
│  │  │                   Web3AuthNoModal                              │ │   │
│  │  │  - Session Management                                          │ │   │
│  │  │  - Connector Orchestration                                     │ │   │
│  │  │  - Provider Management                                         │ │   │
│  │  │  - Plugin System                                               │ │   │
│  │  │  - Analytics                                                   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │                              │                     │
            ▼                              ▼                     ▼
┌───────────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐
│      Connectors       │    │       Providers         │    │     Plugins     │
│ ┌───────────────────┐ │    │ ┌─────────────────────┐ │    │ ┌─────────────┐ │
│ │ Auth Connector    │ │    │ │ CommonJRPCProvider  │ │    │ │ WalletSvc   │ │
│ │ (Social Login)    │ │    │ │ (Universal Proxy)   │ │    │ │ Plugin      │ │
│ ├───────────────────┤ │    │ ├─────────────────────┤ │    │ └─────────────┘ │
│ │ MetaMask Connector│ │    │ │ Ethereum Provider   │ │    └─────────────────┘
│ ├───────────────────┤ │    │ ├─────────────────────┤ │
│ │ WalletConnect V2  │ │    │ │ Solana Provider     │ │
│ ├───────────────────┤ │    │ ├─────────────────────┤ │
│ │ Injected EVM      │ │    │ │ XRPL Provider       │ │
│ ├───────────────────┤ │    │ ├─────────────────────┤ │
│ │ Injected Solana   │ │    │ │ AA Provider         │ │
│ └───────────────────┘ │    │ │ (ERC-4337)          │ │
└───────────────────────┘    │ └─────────────────────┘ │
                             └─────────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │  Web3Auth       │  │  Blockchain      │  │     External Wallets       │ │
│  │  Auth Service   │  │  RPC Nodes       │  │  (MetaMask, Phantom, etc.) │ │
│  │  (@web3auth/    │  │  (Ethereum,      │  │                            │ │
│  │   auth)         │  │   Solana, XRPL)  │  │                            │ │
│  └─────────────────┘  └──────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Web3AuthNoModal Class

The foundation class that manages the authentication lifecycle.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Web3AuthNoModal                                │
├──────────────────────────────────────────────────────────────────────┤
│ State                                                                 │
│ ├── status: CONNECTOR_STATUS_TYPE                                    │
│ ├── connectedConnectorName: WALLET_CONNECTOR_TYPE | null             │
│ ├── cachedConnector: string | null                                   │
│ ├── currentChainId: string | null                                    │
│ └── idToken: string | null                                           │
├──────────────────────────────────────────────────────────────────────┤
│ Core Options                                                          │
│ ├── clientId: string                                                 │
│ ├── web3AuthNetwork: WEB3AUTH_NETWORK                                │
│ ├── chains: CustomChainConfig[]                                      │
│ ├── accountAbstractionConfig?: AccountAbstractionConfig              │
│ ├── walletServicesConfig?: WalletServicesConfig                      │
│ └── uiConfig?: UIConfig                                              │
├──────────────────────────────────────────────────────────────────────┤
│ Internal Components                                                   │
│ ├── connectors: IConnector[]                                         │
│ ├── plugins: Record<string, IPlugin>                                 │
│ ├── commonJRPCProvider: CommonJRPCProvider                           │
│ ├── aaProvider: AccountAbstractionProvider | null                    │
│ ├── analytics: Analytics                                             │
│ └── storage: IStorage                                                │
├──────────────────────────────────────────────────────────────────────┤
│ Public Methods                                                        │
│ ├── init(): Promise<void>                                            │
│ ├── connectTo(connector, params): Promise<IProvider>                 │
│ ├── logout(): Promise<void>                                          │
│ ├── switchChain({ chainId }): Promise<void>                          │
│ ├── getUserInfo(): Promise<UserInfo>                                 │
│ ├── getIdentityToken(): Promise<IdentityTokenInfo>                   │
│ ├── enableMFA(): Promise<void>                                       │
│ └── manageMFA(): Promise<void>                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2. Web3Auth Class (Modal SDK)

Extends `Web3AuthNoModal` with UI capabilities.

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Web3Auth                                    │
│                    (extends Web3AuthNoModal)                          │
├──────────────────────────────────────────────────────────────────────┤
│ Additional Components                                                 │
│ ├── loginModal: LoginModal                                           │
│ └── modalConfig: ConnectorsModalConfig                               │
├──────────────────────────────────────────────────────────────────────┤
│ Additional Methods                                                    │
│ ├── connect(): Promise<IProvider>  // Opens modal                    │
│ └── init(): Promise<void>          // Extended with modal init       │
└──────────────────────────────────────────────────────────────────────┘
```

## Connector Architecture

Connectors abstract different wallet connection methods.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         IConnector Interface                          │
├──────────────────────────────────────────────────────────────────────┤
│ Properties                                                            │
│ ├── name: WALLET_CONNECTOR_TYPE                                      │
│ ├── type: CONNECTOR_CATEGORY (IN_APP | EXTERNAL)                     │
│ ├── status: CONNECTOR_STATUS_TYPE                                    │
│ ├── connectorNamespace: CONNECTOR_NAMESPACE                          │
│ ├── isInjected: boolean                                              │
│ └── icon: string                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Methods                                                               │
│ ├── init(options): Promise<void>                                     │
│ ├── connect(params): Promise<CONNECTED_EVENT_DATA>                   │
│ ├── disconnect(): Promise<void>                                      │
│ ├── switchChain({ chainId }): Promise<void>                          │
│ ├── getUserInfo(): Promise<UserInfo>                                 │
│ ├── getIdentityToken(): Promise<IdentityTokenInfo>                   │
│ └── cleanup(): Promise<void>                                         │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Connector Types                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  IN_APP Connectors                    EXTERNAL Connectors                   │
│  ┌───────────────────┐               ┌───────────────────┐                 │
│  │ Auth Connector    │               │ MetaMask Connector│                 │
│  │ (Web3Auth native) │               │ (MetaMask SDK)    │                 │
│  └───────────────────┘               ├───────────────────┤                 │
│                                      │ WalletConnect V2  │                 │
│                                      │ Connector         │                 │
│                                      ├───────────────────┤                 │
│                                      │ Injected EVM      │                 │
│                                      │ (MIPD discovery)  │                 │
│                                      ├───────────────────┤                 │
│                                      │ Injected Solana   │                 │
│                                      │ (Wallet Standard) │                 │
│                                      ├───────────────────┤                 │
│                                      │ Coinbase Connector│                 │
│                                      └───────────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Connector Namespaces

```
CONNECTOR_NAMESPACES = {
  EIP155: "eip155",      // EVM chains
  SOLANA: "solana",      // Solana
  XRPL: "xrpl",          // XRP Ledger
  OTHER: "other",        // Custom chains
  MULTICHAIN: "multichain" // Supports multiple namespaces
}
```

## Provider Architecture

Providers abstract blockchain interactions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Provider Hierarchy                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │         IProvider               │
                    │  (SafeEventEmitterProvider)     │
                    └───────────────┬─────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌───────────────────────┐ ┌─────────────────┐ ┌───────────────────────┐
│   BaseProvider        │ │ CommonJRPC      │ │ AccountAbstraction    │
│   (Abstract base)     │ │ Provider        │ │ Provider              │
└───────────┬───────────┘ │ (Proxy layer)   │ │ (ERC-4337 wrapper)    │
            │             └─────────────────┘ └───────────────────────┘
            │
    ┌───────┴───────┬───────────────────┐
    │               │                   │
    ▼               ▼                   ▼
┌───────────┐ ┌───────────────┐ ┌─────────────────┐
│ Ethereum  │ │ Solana        │ │ XRPL            │
│ Provider  │ │ Provider      │ │ Provider        │
└───────────┘ └───────────────┘ └─────────────────┘
```

### CommonJRPCProvider

Acts as a universal proxy that wraps underlying blockchain providers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CommonJRPCProvider Flow                               │
└─────────────────────────────────────────────────────────────────────────────┘

  Application Request
        │
        ▼
┌─────────────────────┐
│ CommonJRPCProvider  │  ◄── Unified interface for all chains
│ - request()         │
│ - send()            │
│ - on()              │
└─────────┬───────────┘
          │
          │ Delegates to active provider
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Active Provider Engine (based on connected wallet)                          │
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐  │
│  │ Auth Provider   │ │ External Wallet │ │ Account Abstraction         │  │
│  │ (ws-embed)      │ │ Provider        │ │ Provider (optional)         │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
    Blockchain RPC
```

## Event System

The SDK uses an event-driven architecture with typed events.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONNECTOR_EVENTS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Lifecycle Events                State Events                               │
│  ├── READY                       ├── CONNECTED                              │
│  ├── CONNECTING                  ├── DISCONNECTED                           │
│  ├── AUTHORIZING                 ├── AUTHORIZED                             │
│  └── ERRORED                     └── CONNECTOR_DATA_UPDATED                 │
│                                                                             │
│  Management Events               UI Events                                  │
│  ├── CONNECTORS_UPDATED          ├── MODAL_VISIBILITY                       │
│  ├── MFA_ENABLED                 └── REHYDRATION_ERROR                      │
│  └── CACHE_CLEAR                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              Event Flow
                              
    Connector                 Web3AuthNoModal              Application
        │                           │                           │
        │ emit(CONNECTED)           │                           │
        ├──────────────────────────►│                           │
        │                           │ Process connection        │
        │                           │ Update state              │
        │                           │ Connect plugins           │
        │                           │                           │
        │                           │ emit(CONNECTED)           │
        │                           ├──────────────────────────►│
        │                           │                           │ Update UI
        │                           │                           │
```

## State Management

### Connection State Machine

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        Connection State Machine                            │
└───────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   NOT_READY  │◄────────────────────────────────────────┐
    └──────┬───────┘                                         │
           │ init()                                          │
           ▼                                                 │
    ┌──────────────┐         error                           │
    │    READY     │─────────────────────────────────────────┤
    └──────┬───────┘                                         │
           │ connect()                                       │
           ▼                                                 │
    ┌──────────────┐         error                           │
    │  CONNECTING  │─────────────────────────────────────────┤
    └──────┬───────┘                                         │
           │ connected                                       │
           ▼                                                 │
    ┌──────────────┐                                         │
    │  CONNECTED   │───────┐                                 │
    └──────┬───────┘       │                                 │
           │ getIdToken    │ disconnect()                    │
           ▼               │                                 │
    ┌──────────────┐       │                                 │
    │  AUTHORIZING │       │                                 │
    └──────┬───────┘       │                                 │
           │ authorized    │                                 │
           ▼               │                                 │
    ┌──────────────┐       │                                 │
    │  AUTHORIZED  │◄──────┘                                 │
    └──────┬───────┘                                         │
           │ disconnect()                                    │
           └─────────────────────────────────────────────────┘
                     Returns to READY
```

### Storage Architecture

```typescript
// State persistence strategy
interface IWeb3AuthState {
  cachedConnector: string | null;      // Last used connector
  connectedConnectorName: string | null; // Currently connected
  currentChainId: string;               // Active chain
  idToken: string | null;               // JWT identity token
}

// Storage options
Storage Types:
  ├── localStorage (default)
  ├── sessionStorage  
  ├── cookies (SSR mode)
  └── MemoryStore (fallback)
```

## Plugin System

Plugins extend SDK functionality post-connection.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            IPlugin Interface                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Properties                                                                  │
│ ├── name: string                                                           │
│ ├── status: PLUGIN_STATUS                                                  │
│ ├── pluginNamespace: PLUGIN_NAMESPACE                                      │
│ └── SUPPORTED_CONNECTORS: WALLET_CONNECTOR_TYPE[]                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Methods                                                                     │
│ ├── initWithWeb3Auth(web3Auth, uiConfig, analytics)                        │
│ ├── connect(): Promise<void>                                               │
│ └── disconnect(): Promise<void>                                            │
└─────────────────────────────────────────────────────────────────────────────┘

Currently Implemented:
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Wallet Services Plugin                                │
│  - Portfolio widget                                                         │
│  - Token display                                                            │
│  - NFT display                                                              │
│  - Send/Receive                                                             │
│  - Swap functionality                                                       │
│  - WalletConnect scanner                                                    │
│  - Key export                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Social Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Social Login Flow                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    User            Application          Web3Auth SDK        Web3Auth Service
      │                  │                    │                     │
      │ Click Login      │                    │                     │
      ├─────────────────►│                    │                     │
      │                  │ connect()          │                     │
      │                  ├───────────────────►│                     │
      │                  │                    │ Init Auth Connector │
      │                  │                    ├────────────────────►│
      │                  │                    │                     │
      │◄─────────────────┼────────────────────┼─── Redirect/Popup ──┤
      │                  │                    │                     │
      │ OAuth Login      │                    │                     │
      ├─────────────────►│                    │                     │
      │                  │                    │                     │
      │◄─────────────────┼────────────────────┼─── Auth Response ───┤
      │                  │                    │                     │
      │                  │                    │ Key Reconstruction  │
      │                  │                    │ (MPC)               │
      │                  │                    │◄────────────────────┤
      │                  │                    │                     │
      │                  │◄── Provider ───────┤                     │
      │                  │                    │                     │
      │◄─ Connected ─────┤                    │                     │
      │                  │                    │                     │
```

### External Wallet Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       External Wallet Flow                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    User            Application          Web3Auth SDK        External Wallet
      │                  │                    │                     │
      │ Select Wallet    │                    │                     │
      ├─────────────────►│                    │                     │
      │                  │ connectTo(wallet)  │                     │
      │                  ├───────────────────►│                     │
      │                  │                    │ Request Connection  │
      │                  │                    ├────────────────────►│
      │                  │                    │                     │
      │◄─────────────────┼────────────────────┼─ Approval Request ──┤
      │                  │                    │                     │
      │ Approve          │                    │                     │
      ├─────────────────►│                    │                     │
      │                  │                    │◄─── Provider ───────┤
      │                  │                    │                     │
      │                  │◄── Provider ───────┤                     │
      │                  │                    │                     │
      │◄─ Connected ─────┤                    │                     │
```

## Account Abstraction Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Account Abstraction (ERC-4337) Flow                       │
└─────────────────────────────────────────────────────────────────────────────┘

    Application          AA Provider         Bundler           Smart Account
        │                    │                  │                    │
        │ sendTransaction    │                  │                    │
        ├───────────────────►│                  │                    │
        │                    │                  │                    │
        │                    │ Create UserOp    │                    │
        │                    ├──────────────────┼───────────────────►│
        │                    │                  │                    │
        │                    │ Sign UserOp      │                    │
        │                    │ (EOA Provider)   │                    │
        │                    │                  │                    │
        │                    │ Submit to Bundler│                    │
        │                    ├─────────────────►│                    │
        │                    │                  │                    │
        │                    │                  │ Submit to Chain    │
        │                    │                  ├───────────────────►│
        │                    │                  │                    │
        │◄─ Transaction Hash─┤                  │                    │
        │                    │                  │                    │

Configuration:
┌─────────────────────────────────────────────────────────────────────────────┐
│ accountAbstractionConfig: {                                                 │
│   smartAccountType: "biconomy" | "safe" | "kernel" | "light" | "nexus",    │
│   chains: [{                                                                │
│     chainId: "0x1",                                                         │
│     bundlerConfig: { url: "https://bundler.example.com" },                 │
│     paymasterConfig: { url: "https://paymaster.example.com" }              │
│   }]                                                                        │
│ }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Initialization Flow                                │
└─────────────────────────────────────────────────────────────────────────────┘

    init() called
         │
         ▼
    ┌────────────────┐
    │ Fetch Project  │───► Dashboard Configuration
    │ Config         │     (chains, auth methods, etc.)
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Initialize     │
    │ Configurations │
    │ - Chains       │
    │ - AA Config    │
    │ - UI Config    │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Setup          │
    │ CommonJRPC     │───► Universal provider ready
    │ Provider       │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Load & Init    │───► Auth, MetaMask, WC, Injected...
    │ Connectors     │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Init Plugins   │───► Wallet Services
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Auto-connect   │───► If cached connector exists
    │ (if cached)    │
    └───────┬────────┘
            │
            ▼
       READY state
```

## Security Considerations

### Key Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Key Management (MPC)                                │
└─────────────────────────────────────────────────────────────────────────────┘

    User Device              Web3Auth Nodes              Social Provider
         │                        │                           │
         │                        │                           │
    ┌────┴────┐             ┌─────┴─────┐               ┌─────┴─────┐
    │ Share 1 │             │ Share 2   │               │ OAuth     │
    │ (Device)│             │ (Network) │               │ Provider  │
    └────┬────┘             └─────┬─────┘               └─────┬─────┘
         │                        │                           │
         └────────────────────────┴───────────────────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │ Threshold     │
                          │ Signature     │
                          │ (2 of 3)      │
                          └───────────────┘
                                  │
                                  ▼
                          Transaction Signed
                          (Key never fully reconstructed)
```

### Security Best Practices Enforced

1. **Non-custodial:** Keys never leave user's control
2. **No private key storage:** MPC eliminates single point of failure
3. **Domain whitelisting:** Configured in dashboard
4. **Session management:** Configurable expiry with secure storage
5. **HTTPS only:** All communications encrypted
