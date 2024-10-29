# Web3Auth Ethereum Provider

[![npm version](https://img.shields.io/npm/v/@web3auth/ethereum-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/ethereum-provider/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/ethereum-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/ethereum-provider@latest)

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
npm install --save @web3auth/ethereum-provider
```

## 🩹 Example

```ts
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
const clientId = "YOUR_WEB3AUTH_CLIENT_ID"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider,
}
const web3auth = new Web3Auth(web3AuthOptions);
```

Check out the examples for your preferred blockchain and platform on our [examples page](https://web3auth.io/docs/examples).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo.web3auth.io) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
