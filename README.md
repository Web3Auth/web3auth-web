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
npm install --save @web3auth/core
npm install --save @web3auth/base
npm install --save @web3auth/torus-wallet-adapter
npm install --save @web3auth/solana-wallet-adapter
npm install --save @web3auth/openlogin-adapter
npm install --save @web3auth/customauth-adapter
npm install --save @web3auth/solana-provider
npm install --save @web3auth/ethereum-provider
npm install --save @web3auth/solanaWeb3Wrapper
# ...
```

3. Then you can add Web3Modal to your Dapp as follows

```js
import Web3Auth, { getTorusWalletAdapter, getSolanaWalletAdapter, ADAPTER_NAMES } from "@web3auth/core";
import SolanaWeb3Wrapper from "@web3auth/solanaWeb3Wrapper";
import web3 from "web3";

const web3Auth = new Web3Auth();
web3Auth.addWallet(getTorusWalletAdapter())
web3Auth.addWallet(getSolanaWalletAdapter({}))

let provider = await web3Auth.connectTo(ADAPTER_NAMES.SOLANA_WALLET_ADAPTER);

const solWeb3 = new SolanaWeb3Wrapper(provider);

...
...

let provider = await web3Auth.connectTo(ADAPTER_NAMES.TORUS_WALLET_ADAPTER);
const evmWeb3 = new Web3(provider);

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
