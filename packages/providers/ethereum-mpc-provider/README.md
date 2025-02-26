# Web3Auth Ethereum MPC Provider

[![npm version](https://img.shields.io/npm/v/@web3auth-mpc/ethereum-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth-mpc/ethereum-provider/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth-mpc/ethereum-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth-mpc/ethereum-provider@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Web3Auth Ethereum Provider can be used to interact with wallet or connected EVM compatible chain using RPC calls. This is an EIP-1193 compatible JRPC provider. This package exposes a class `EthereumPrivateKeyProvider`, which accepts a `secp251k1` private key and returns `EIP1193` compatible provider, which can be used with various wallet sdks.

## 📖 Documentation

Read more about Web3Auth Ethereum Provider in the [official Web3Auth Documentation](https://web3auth.io/docs/sdk/web/providers/evm#getting-a-provider-from-any-secp256k1-private-key).

## 💡 Features

- Plug and Play, OAuth based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for WebAuthn & Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

...and a lot more

## 🔗 Installation

```shell
npm install --save @web3auth/ethereum-mpc-provider
```

## 🩹 Example

```ts
import { Web3AuthMPCCoreKit, WEB3AUTH_NETWORK, makeEthereumSigner } from "@web3auth/mpc-core-kit";
import { EthereumSigningProvider } from '@web3auth/ethereum-mpc-provider';
import { CHAIN_NAMESPACES } from "@web3auth/base";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1", // Please use 0x1 for Mainnet
  rpcTarget: "https://rpc.ankr.com/eth",
  displayName: "Ethereum Mainnet",
  blockExplorer: "https://etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const coreKitInstance = new Web3AuthMPCCoreKit({
  web3AuthClientId: "YOUR_WEB3AUTH_CLIENT_ID",
  web3AuthNetwork: WEB3AUTH_NETWORK.MAINNET,
  storage: window.localStorage,
  manualSync: true, // This is the recommended approach
  tssLib: tssLib
});

// Setup provider for EVM Chain
const evmProvider = new EthereumSigningProvider({ config: { chainConfig } });
evmProvider.setupProvider(makeEthereumSigner(coreKitInstance));
```

Check out the examples for your preferred blockchain and platform on our [examples page](https://web3auth.io/docs/examples).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo.web3auth.io) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
