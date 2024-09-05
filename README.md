# Web3Auth

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/no-modal)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/web3auth/web3auth/Build%20&%20Release)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/web/) to get started!

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

## 💭 Choosing Between SDKs

For using Web3Auth in the web, you have two choices of SDKs to get started with.

[Web3Auth Plug and Play Modal SDK `@web3auth/modal`](https://web3auth.io/docs/sdk/web/web3auth/): A simple and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. You can use the pre-configured Web3Auth Modal UI and whitelabel it according to your needs.

[Web3Auth Plug and Play NoModal SDK `@web3auth/no-modal`](https://web3auth.io/docs/sdk/web/no-modal/): The nomodal module implementing all the Web3Auth features you need and giving you the flexibility of using your own UI with the Web3Auth SDK working in the backend.

## ⚡ Quick Start

### Installation (Web3Auth Plug and Play Modal)

```shell
npm install --save @web3auth/modal
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://github-production-user-asset-6210df.s3.amazonaws.com/6962565/272779464-043f6383-e671-4aa5-80fb-ec87c569e5ab.png)

### Initialize Web3Auth for your preferred blockchain

Web3Auth needs to initialise as soon as your app loads up to enable the user to log in. Preferably done within a constructor, initialisation is the step where you can pass on all the configurations for Web3Auth you want. A simple integration for Ethereum blockchain will look like this:

```js
import { Web3Auth } from "@web3auth/modal";

//Initialize within your constructor
const web3auth = new Web3Auth({
  clientId: "", // Get your Client ID from Web3Auth Dashboard
  chainConfig: {
    chainNamespace: "eip155",
    chainId: "0x1",
  },
});

await web3auth.initModal();
```

### Login your User

Once you're done initialising, just create a button that triggers to open the login modal for the user on their request. Logging in is as easy as:

```js
await web3auth.connect();
```

## 📦 Packages within this repository

| Packages                                       | `@latest` Version                                                                                                                                                                             | Size                                                                                                                                                                                                     | Description                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🏠 **PnP Web**                                 |
| `@web3auth/no-modal`                           | [![npm version](https://img.shields.io/npm/v/@web3auth/no-modal?label=%22%22)](https://www.npmjs.com/package/@web3auth/no-modal/v/latest)                                                     | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/no-modal?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/no-modal@latest)                                                     | Provides the core logic for handling adapters within web3auth. This package acts as a manager for all the adapters. You should use this package to build your custom login UI on top of web3auth.                                                                                                                    |
| `@web3auth/modal`                              | [![npm version](https://img.shields.io/npm/v/@web3auth/modal?label=%22%22)](https://www.npmjs.com/package/@web3auth/modal/v/latest)                                                           | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/modal?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/modal@latest)                                                           | Provides the main class for using default web3auth modal. It inherits `@web3auth/no-modal` package. So you can still call all the functions available in the `@web3auth/no-modal` api reference. The package includes all of our packages and gives you a simple way of implementing Web3Auth within your interface. |
| 🪝 **PnP Web Hooks**                           |
| `@web3auth/modal-react-hooks`                  | [![npm version](https://img.shields.io/npm/v/@web3auth/modal-react-hooks?label=%22%22)](https://www.npmjs.com/package/@web3auth/modal-react-hooks/v/latest)                                   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/modal-react-hooks?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/modal-react-hooks@latest)                                   | Provides React hooks for easy integration of Web3Auth Modal in React applications. Simplifies state management and Web3Auth interactions within React components.                                                                                                                                                    |
| `@web3auth/no-modal-react-hooks`               | [![npm version](https://img.shields.io/npm/v/@web3auth/no-modal-react-hooks?label=%22%22)](https://www.npmjs.com/package/@web3auth/no-modal-react-hooks/v/latest)                             | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/no-modal-react-hooks?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/no-modal-react-hooks@latest)                             | Provides React hooks for integrating Web3Auth No Modal SDK in React applications. Offers flexibility for custom UI implementations while simplifying Web3Auth state management and interactions.                                                                                                                     |
| 🔌 **Adapters**                                |
| `@web3auth/coinbase-adapter`                   | [![npm version](https://img.shields.io/npm/v/@web3auth/coinbase-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/coinbase-adapter/v/latest)                                     | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/coinbase-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/coinbase-adapter@latest)                                     | Adds coinbase login functionality                                                                                                                                                                                                                                                                                    |
| `@web3auth/metamask-adapter`                   | [![npm version](https://img.shields.io/npm/v/@web3auth/metamask-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/metamask-adapter/v/latest)                                     | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/metamask-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/metamask-adapter@latest)                                     | Adds metamask chrome extension login functionality                                                                                                                                                                                                                                                                   |
| `@web3auth/openlogin-adapter`                  | [![npm version](https://img.shields.io/npm/v/@web3auth/openlogin-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/openlogin-adapter/v/latest)                                   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/openlogin-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/openlogin-adapter@latest)                                   | Adds social logins with MFA functionality                                                                                                                                                                                                                                                                            |
| `@web3auth/phantom-adapter`                    | [![npm version](https://img.shields.io/npm/v/@web3auth/phantom-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/phantom-adapter/v/latest)                                       | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/phantom-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/phantom-adapter@latest)                                       | Adds phantom chrome extension login functionality                                                                                                                                                                                                                                                                    |
| `@web3auth/torus-evm-adapter`                  | [![npm version](https://img.shields.io/npm/v/@web3auth/torus-evm-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/torus-evm-adapter/v/latest)                                   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/torus-evm-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/torus-evm-adapter@latest)                                   | Adds Torus Wallet login functionality (https://app.tor.us)                                                                                                                                                                                                                                                           |
| `@web3auth/torus-solana-adapter`               | [![npm version](https://img.shields.io/npm/v/@web3auth/torus-solana-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/torus-solana-adapter/v/latest)                             | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/torus-solana-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/torus-solana-adapter@latest)                             | Adds Solana Torus Wallet login functionality (https://solana.tor.us)                                                                                                                                                                                                                                                 |
| `@web3auth/wallet-connect-v2-adapter`          | [![npm version](https://img.shields.io/npm/v/@web3auth/wallet-connect-v2-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/wallet-connect-v2-adapter/v/latest)                   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/wallet-connect-v2-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/wallet-connect-v2-adapter@latest)                   | Adds wallet connect v2 login functionality + all supported adapters (eg: Metamask mobile, rainbow etc.)                                                                                                                                                                                                              |
| 🐉 **Providers**                               |
| `@web3auth/base-provider`                      | [![npm version](https://img.shields.io/npm/v/@web3auth/base-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/base-provider/v/latest)                                           | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/base-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/base-provider@latest)                                           | Base implementation of JRPC provider                                                                                                                                                                                                                                                                                 |
| `@web3auth/ethereum-provider`                  | [![npm version](https://img.shields.io/npm/v/@web3auth/ethereum-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/ethereum-provider/v/latest)                                   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/ethereum-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/ethereum-provider@latest)                                   | EIP-1193 compatible JRPC provider                                                                                                                                                                                                                                                                                    |
| `@web3auth/solana-provider`                    | [![npm version](https://img.shields.io/npm/v/@web3auth/solana-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/solana-provider/v/latest)                                       | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/solana-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/solana-provider@latest)                                       | Solana chain compatible JRPC provider                                                                                                                                                                                                                                                                                |
| 🐉 **Plugins**                                 |                                                                                                                                                                                               |
| `@web3auth/wallet-services-plugin`             | [![npm version](https://img.shields.io/npm/v/@web3auth/wallet-services-plugin?label=%22%22)](https://www.npmjs.com/package/@web3auth/wallet-services-plugin/v/latest)                         | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/wallet-services-plugin?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/wallet-services-plugin@latest)                         | Allows to inject your web3auth scoped private key into Wallet Services UI                                                                                                                                                                                                                                            |
| `@web3auth/wallet-services-plugin-react-hooks` | [![npm version](https://img.shields.io/npm/v/@web3auth/wallet-services-plugin-react-hooks?label=%22%22)](https://www.npmjs.com/package/@web3auth/wallet-services-plugin-react-hooks/v/latest) | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/wallet-services-plugin-react-hooks?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/wallet-services-plugin-react-hooks@latest) | Allows to inject your web3auth scoped private key into Wallet Services UI                                                                                                                                                                                                                                            |
| `@web3auth/solana-wallet-connector-plugin`     | [![npm version](https://img.shields.io/npm/v/@web3auth/solana-wallet-connector-plugin?label=%22%22)](https://www.npmjs.com/package/@web3auth/solana-wallet-connector-plugin/v/latest)         | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/solana-wallet-connector-plugin?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/solana-wallet-connector-plugin@latest)         | Allows to inject your web3auth scoped private key into torus solana wallet UI (https://solana.tor.us)                                                                                                                                                                                                                |
| 🐉 **Low-Level**                               |
| `@web3auth/base`                               | [![npm version](https://img.shields.io/npm/v/@web3auth/base?label=%22%22)](https://www.npmjs.com/package/@web3auth/base/v/latest)                                                             | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/base?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/base@latest)                                                             | Base reusable functionalities for creating a web3auth instance                                                                                                                                                                                                                                                       |
| `@web3auth/ui`                                 | [![npm version](https://img.shields.io/npm/v/@web3auth/ui?label=%22%22)](https://www.npmjs.com/package/@web3auth/ui/v/latest)                                                                 | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/ui?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/ui@latest)                                                                 | Provides the UI used for creating the modal                                                                                                                                                                                                                                                                          |

## ⏪ Requirements

- All packages require a peer dependency of `@babel/runtime`
- Node 18+

## 🧳 Bundling

This module is distributed in 4 formats

- `esm` build `dist/package.esm.js` in es6 format
- `commonjs` build `dist/package.cjs.js` in es5 format
- `umd` build `dist/package.umd.min.js` in es5 format without polyfilling corejs minified

By default, the appropriate format is used for your specified usecase
You can use a different format (if you know what you're doing) by referencing the correct file

The cjs build is not polyfilled with core-js.
It is upto the user to polyfill based on the browserlist they target

### Directly in Browser

CDN's serve the non-core-js polyfilled version by default. You can use a different

Please replace package and version with the appropriate package name

#### `jsdeliver`

```js
<script src="https://cdn.jsdelivr.net/npm/@web3auth/PACKAGE@VERSION"></script>
```

#### `unpkg`

```js
<script src="https://unpkg.com/@web3auth/PACKAGE@VERSION"></script>
```

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

Further checkout the [demo folder](https://github.com/Web3Auth/Web3Auth/tree/master/demo) within this repository, which contains other hosted demos for different usecases.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to create new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.

TODO:

- add default adapter modules
- whitelabel only at one place
