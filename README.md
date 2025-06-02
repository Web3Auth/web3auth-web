# Web3Auth

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/modal)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/web/) to get started!

## 💡 Features

- Plug and Play, OAuth based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for Email and Mobile Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

  ...and a lot more

## 🎯 Web3Auth Modal SDK

[Web3Auth Plug and Play Modal SDK `@web3auth/modal`](https://web3auth.io/docs/sdk/web/web3auth/) provides a simple and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. You can use the pre-configured Web3Auth Modal UI and whitelabel it according to your needs.

## ⚡ Quick Start

### Installation

```shell
npm install --save @web3auth/modal
```

### Prerequisites

Before you start, make sure you have registered on the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and have set up your project. Use the Client ID of the project to start your integration.

### React Integration

Web3Auth provides React Hooks for seamless integration with React applications.

#### 1. Create Configuration

```tsx
// web3authContext.tsx
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";

const web3AuthOptions: Web3AuthOptions = {
  clientId: "YOUR_CLIENT_ID", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
};

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
};

export default web3AuthContextConfig;
```

#### 2. Setup Provider

```tsx
// main.tsx or index.tsx
import ReactDOM from "react-dom/client";
import { Web3AuthProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "./web3authContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Web3AuthProvider config={web3AuthContextConfig}>
    <App />
  </Web3AuthProvider>
);
```

#### 3. Use Web3Auth Hooks

```tsx
// App.tsx
import { useWeb3AuthConnect } from "@web3auth/modal/react";

function ConnectButton() {
  const { connect, loading, isConnected, error } = useWeb3AuthConnect();

  return (
    <button onClick={() => connect()} disabled={loading || isConnected}>
      {loading ? "Connecting..." : isConnected ? "Connected" : "Connect"}
    </button>
    {error && <div>{error.message}</div>}
  );
}
```

### Vue Integration

Web3Auth provides Vue Composables for seamless integration with Vue applications.

#### 1. Create Configuration

```ts
// web3authContext.ts
import { type Web3AuthContextConfig } from "@web3auth/modal/vue";
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";

const web3AuthOptions: Web3AuthOptions = {
  clientId: "YOUR_CLIENT_ID", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
};

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
};

export default web3AuthContextConfig;
```

#### 2. Setup Provider

```html
<!-- App.vue -->
<script setup lang="ts">
import Home from "./Home.vue";
import { Web3AuthProvider } from "@web3auth/modal/vue";
import web3AuthContextConfig from "./web3authContext";
</script>

<template>
  <Web3AuthProvider :config="web3AuthContextConfig">
    <Home />
  </Web3AuthProvider>
</template>
```

#### 3. Use Web3Auth Composables

```html
<!-- Home.vue -->
<script setup lang="ts">
  import { useWeb3AuthConnect } from "@web3auth/modal/vue";

  const { connect, loading, isConnected, error } = useWeb3AuthConnect();
</script>

<template>
  <button @click="connect" :disabled="loading || isConnected">
    <span v-if="loading">Connecting...</span>
    <span v-else-if="isConnected">Connected</span>
    <span v-else>Connect</span>
  </button>
  <div v-if="error">{{ error.message }}</div>
</template>
```

### JavaScript Integration

For vanilla JavaScript or other frameworks, use the standard Web3Auth Modal SDK.

#### 1. Initialize Web3Auth

```javascript
import { Web3Auth, WEB3AUTH_NETWORK } from "@web3auth/modal";

const web3auth = new Web3Auth({
  clientId: "YOUR_CLIENT_ID", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
});

// Initialize the SDK
await web3auth.init();
```

#### 2. Login User

```javascript
// Login
await web3auth.connect();

// Get user info
const user = await web3auth.getUserInfo();

// Logout
await web3auth.logout();
```

## 🔧 Advanced Configuration

The Web3Auth Modal SDK offers a rich set of advanced configuration options:

- **Smart Accounts**: Configure account abstraction parameters
- **Custom Authentication**: Define authentication methods
- **Whitelabeling & UI Customization**: Personalize the modal's appearance
- **Multi-Factor Authentication (MFA)**: Set up and manage MFA
- **Wallet Services**: Integrate additional wallet services

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

Check out the examples for your preferred blockchain and platform on our [examples page](https://web3auth.io/docs/examples).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo.web3auth.io) to see how Web3Auth can be used in your application.

For more detailed examples, visit our [Web3Auth Examples repository](https://github.com/Web3Auth/web3auth-examples/). This repository contains a comprehensive collection of sample projects to help you get started with your Web3Auth integration.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to create new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.

