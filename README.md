# Web3Auth

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/core)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/web3auth/web3auth/Build%20&%20Release)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/web/) to get started!

## 💭 Choosing Between SDKs

For using Web3Auth in the web, you have two choices of SDKs to get started with.

[Web3Auth Plug and Play UI SDK `@web3auth/web3auth`](https://web3auth.io/docs/sdk/web/web3auth/): A simple and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. You can use the pre-configured Web3Auth Modal UI and whitelabel it according to your needs.

[Web3Auth Plug and Play Core SDK `@web3auth/core`](https://web3auth.io/docs/sdk/web/core/): The core module implemeting all the Web3Auth features you need and giving you the flexibilty of using your own UI with the Web3Auth SDK working in the backend.

## ⚡ Quick Start

### Installation (Web3Auth Plug and Play UI)

```shell
npm install --save @web3auth/web3auth
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://web3auth.io/docs/assets/images/project_plug_n_play-89c39ec42ad993107bb2485b1ce64b89.png)

### Initialize Web3Auth for your preferred blockchain

Web3Auth needs to initialise as soon as your app loads up to enable the user to log in. Preferably done within a constructor, initialisation is the step where you can pass on all the configurations for Web3Auth you want. A simple integration for Ethereum blockchain will look like this:

```js
import { Web3Auth } from "@web3auth/web3auth";

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

| Packages                                   | `@latest` Version                                                                                                                                                                     | Size                                                                                                                                                                                             | Description                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🏠 **Core**                                |
| `@web3auth/core`                           | [![npm version](https://img.shields.io/npm/v/@web3auth/core?label=%22%22)](https://www.npmjs.com/package/@web3auth/core/v/latest)                                                     | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/core?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/core@latest)                                                     | Provides the core logic for handling adapters within web3auth. This package acts as a manager for all the adapters. You should use this package to build your custom login UI on top of web3auth.                                                                                                            |
| `@web3auth/web3auth`                       | [![npm version](https://img.shields.io/npm/v/@web3auth/web3auth?label=%22%22)](https://www.npmjs.com/package/@web3auth/web3auth/v/latest)                                             | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/web3auth?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/web3auth@latest)                                             | Provides the main class for using default web3auth modal. It inherits `@web3auth/core` package. So you can still call all the functions available in the `@web3auth/core` api reference. The package includes all of our packages and gives you a simple way of implementing Web3Auth within your interface. |
| 🔌 **Adapters**                            |
| `@web3auth/coinbase-adapter`               | [![npm version](https://img.shields.io/npm/v/@web3auth/coinbase-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/coinbase-adapter/v/latest)                             | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/coinbase-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/coinbase-adapter@latest)                             | Adds coinbase login functionality                                                                                                                                                                                                                                                                            |
| `@web3auth/metamask-adapter`               | [![npm version](https://img.shields.io/npm/v/@web3auth/metamask-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/metamask-adapter/v/latest)                             | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/metamask-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/metamask-adapter@latest)                             | Adds metamask chrome extension login functionality                                                                                                                                                                                                                                                           |
| `@web3auth/openlogin-adapter`              | [![npm version](https://img.shields.io/npm/v/@web3auth/openlogin-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/openlogin-adapter/v/latest)                           | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/openlogin-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/openlogin-adapter@latest)                           | Adds social logins with MFA functionality                                                                                                                                                                                                                                                                    |
| `@web3auth/phantom-adapter`                | [![npm version](https://img.shields.io/npm/v/@web3auth/phantom-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/phantom-adapter/v/latest)                               | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/phantom-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/phantom-adapter@latest)                               | Adds phantom chrome extension login functionality                                                                                                                                                                                                                                                            |
| `@web3auth/torus-evm-adapter`              | [![npm version](https://img.shields.io/npm/v/@web3auth/torus-evm-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/torus-evm-adapter/v/latest)                           | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/torus-evm-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/torus-evm-adapter@latest)                           | Adds Torus Wallet login functionality (https://app.tor.us)                                                                                                                                                                                                                                                   |
| `@web3auth/torus-solana-adapter`           | [![npm version](https://img.shields.io/npm/v/@web3auth/torus-solana-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/torus-solana-adapter/v/latest)                     | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/torus-solana-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/torus-solana-adapter@latest)                     | Adds Solana Torus Wallet login functionality (https://solana.tor.us)                                                                                                                                                                                                                                         |
| `@web3auth/wallet-connect-v1-adapter`      | [![npm version](https://img.shields.io/npm/v/@web3auth/wallet-connect-v1-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/wallet-connect-v1-adapter/v/latest)           | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/wallet-connect-v1-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/wallet-connect-v1-adapter@latest)           | Adds wallet connect v1 login functionality + all supported adapters (eg: Metamask mobile, rainbow etc.)                                                                                                                                                                                                      |
| 🐉 **Providers**                           |
| `@web3auth/base-provider`                  | [![npm version](https://img.shields.io/npm/v/@web3auth/base-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/base-provider/v/latest)                                   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/base-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/base-provider@latest)                                   | Base implementation of JRPC provider                                                                                                                                                                                                                                                                         |
| `@web3auth/ethereum-provider`              | [![npm version](https://img.shields.io/npm/v/@web3auth/ethereum-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/ethereum-provider/v/latest)                           | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/ethereum-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/ethereum-provider@latest)                           | EIP-1193 compatible JRPC provider                                                                                                                                                                                                                                                                            |
| `@web3auth/solana-provider`                | [![npm version](https://img.shields.io/npm/v/@web3auth/solana-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/solana-provider/v/latest)                               | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/solana-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/solana-provider@latest)                               | Solana chain compatible JRPC provider                                                                                                                                                                                                                                                                        |
| 🐉 **Plugins**                             |
| `@web3auth/base-plugin`                    | [![npm version](https://img.shields.io/npm/v/@web3auth/base-plugin?label=%22%22)](https://www.npmjs.com/package/@web3auth/base-plugin/v/latest)                                       | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/base-plugin?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/base-plugin@latest)                                       | Base implementation of plugin                                                                                                                                                                                                                                                                                |
| `@web3auth/torus-wallet-connector-plugin`  | [![npm version](https://img.shields.io/npm/v/@web3auth/torus-wallet-connector-plugin?label=%22%22)](https://www.npmjs.com/package/@web3auth/torus-wallet-connector-plugin/v/latest)   | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/torus-wallet-connector-plugin?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/torus-wallet-connector-plugin@latest)   | Allows to inject your web3auth scoped private key into torus wallet UI (https://app.tor.us)                                                                                                                                                                                                                  |
| `@web3auth/solana-wallet-connector-plugin` | [![npm version](https://img.shields.io/npm/v/@web3auth/solana-wallet-connector-plugin?label=%22%22)](https://www.npmjs.com/package/@web3auth/solana-wallet-connector-plugin/v/latest) | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/solana-wallet-connector-plugin?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/solana-wallet-connector-plugin@latest) | Allows to inject your web3auth scoped private key into torus solana wallet UI (https://solana.tor.us)                                                                                                                                                                                                        |
| 🐉 **Low-Level**                           |
| `@web3auth/base`                           | [![npm version](https://img.shields.io/npm/v/@web3auth/base?label=%22%22)](https://www.npmjs.com/package/@web3auth/base/v/latest)                                                     | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/base?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/base@latest)                                                     | Base reusable functionalities for creating a web3auth instance                                                                                                                                                                                                                                               |
| `@web3auth/ui`                             | [![npm version](https://img.shields.io/npm/v/@web3auth/ui?label=%22%22)](https://www.npmjs.com/package/@web3auth/ui/v/latest)                                                         | [![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/ui?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/ui@latest)                                                         | Provides the UI used for creating the modal                                                                                                                                                                                                                                                                  |

## ⏪ Requirements

- All packages require a peer dependency of `@babel/runtime`
- Node 14+

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

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.
