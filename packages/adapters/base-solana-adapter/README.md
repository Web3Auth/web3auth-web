# Web3Auth Base solana Adapter (Basic Types and Interface for Web3Auth)

[![npm version](https://img.shields.io/npm/v/@web3auth/base-solana-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/base-solana-adapter/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/base?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/base-solana-adapter@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Web3Auth Base solana Adapter contains a base class for solana adapters.

## 📖 Documentation

Read more about the Web3Auth in the [official Web3Auth Documentation](https://web3auth.io/docs/sdk/web/).

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
npm install --save @web3auth/base-solana-adapter
```

## 🩹 Example

```ts
import { BaseSolanaAdapter } from "@web3auth/base-solana-adapter";


export class solanaAdapter extends BaseSolanaAdapter<void> {
}
```

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
