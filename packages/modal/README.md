# Web3Auth Plug and Play Modal

[![npm version](https://img.shields.io/npm/v/@web3auth/modal?label=%22%22)](https://www.npmjs.com/package/@web3auth/modal/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/modal?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/modal@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

This package provides main class for using default Web3Auth Modal. The package includes all of our packages and gives you a simple way of implementing Web3Auth within your interface. Additionally, it is a child class of [`@web3auth/no-modal`](https://web3auth.io/docs/sdk/web/no-modal/) package. Hence, you can still call all the functions available in the [`@web3auth/no-modal`](https://web3auth.io/docs/sdk/web/no-modal/) package.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs/sdk/web/web3auth/) to get started.

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
npm install --save @web3auth/modal
```

## ⚡ Quick Start

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

## 🩹 Examples

Check out the examples for your preferred blockchain and platform on our [examples page](https://web3auth.io/docs/examples).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo.web3auth.io) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
