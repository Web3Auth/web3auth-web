# Web3Auth WalletConnect Connector

[![npm version](https://img.shields.io/npm/v/@web3auth/wallet-connect-connector?label=%22%22)](https://www.npmjs.com/package/@web3auth/wallet-connect-connector/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/wallet-connect-connector?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/wallet-connect-connector@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Wallet connect Connector allows your Web3Auth Instance to connect with wallet connect v2. 
## 📖 Documentation

Read more about the Web3Auth WalletConnect Connector in the [official Web3Auth Documentation](https://web3auth.io/docs/sdk/web/adapters/wallet-connect).

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

## 📄 Basic Details

- Connector Name: `wallet-connect-v2`

- Package Name: [`@web3auth/wallet-connect-connector`](https://web3auth.io/docs/sdk/web/adapters/wallet-connect-v2)

- authMode: `DAPP`

- chainNamespace: `EIP155`

- Default: `YES`

## 🔗 Installation

```shell
npm install --save @web3auth/wallet-connect-connector
```

## 🩹 Example


```ts
import { WalletConnectConnector } from "@web3auth/wallet-connect-connector";

  const wcConnector = new WalletConnectConnector({
      connectorSettings: {
        qrcodeModal: QRCodeModal, // QRCodeModal is not required if you are using web3auth modal
        walletConnectInitOptions: {
          projectId: "YOUR WALLET CONNECT PROJECT ID",
        }
        },
      chainConfig: currentChainConfig,
  });


web3auth.configureConnector(wcConnector);
```

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.
