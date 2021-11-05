# Web3Modal

A single Web3 / Multi-chain / Auth provider solution for OAuth logins and crypto wallets.

## Introduction

[TBD]

## Usage

1. Install Web3Auth NPM package

```bash
npm install --save @web3auth/base
```

2. Install Provider packages

Install one or several of provider packages

```bash
npm install --save @web3auth/openlogin-provider
npm install --save @web3auth/customauth-provider
npm install --save @web3auth/customauth-provider
npm install --save @web3auth/walletconnect-provider
# ...
```

3. Then you can add Web3Modal to your Dapp as follows

```js
import Web3Auth from "@web3auth/base";
import Web3AuthOpenLoginProvider from "@web3auth/openlogin-provider";
import Web3AuthWalletConnectProvider from "@web3auth/walletconnect-provider";

const web3Auth = new Web3Auth({
  network: "mainnet",
  oauthProvider: new Web3AuthOpenLoginProvider(/* OpenLogin options */)
  providers: {
    walletConnect: new Web3AuthWalletConnectProvider(/* WalletConnect options */)
    // ... other providers
  }
});

const connection = await web3Auth.connect(); // Show login modal

// Check type of connection and wrap it with specific chain library like web3.js, @solana/web3.js, etc
const web3 = new Web3(connection);

// TODO: We can add another layer of abstraction here to provide utilities for also connecting with different chains.
```

## Events

You should subscribe to auth events.

```typescript
// Subscribe to connection
web3Auth.addEventListeners("connect", (e) => {
  console.log(e.connection);
});

// Subscribe to disconnection
web3Auth.addEventListeners("disconnect", (e) => {
  console.log(e.reason);
});

// TODO: What is other event we should have?
```

## Connect to specific provider

In case you want to connect a specific provider, you can use the method `connectTo` and use the specific id. Example:

```js
import Web3Auth from "@web3auth/base";
import Web3AuthOpenLoginProvider from "@web3auth/openlogin-provider";
import Web3AuthWalletConnectProvider from "@web3auth/walletconnect-provider";

const web3Auth = new Web3Auth({
  network: "mainnet",
  oauthProvider: new Web3AuthOpenLoginProvider(/* OpenLogin options */)
  providers: {
    walletConnect: new Web3AuthWalletConnectProvider(/* WalletConnect options */)
    // ... other providers
  }
});

const connection = await web3Auth.connectTo("walletConnect"); // Trigger connect to WalletConnect

// Check type of connection and wrap it with specific chain library like web3.js, @solana/web3.js, etc
const web3 = new Web3(connection);
```

## Adding a new provider

Create a new package, implement `Web3AuthProvider` or `Web3AuthOAuthProvider`, return a connection object that can work with desired blockchain library.
