# Web3Auth Auth Adapter

[![npm version](https://img.shields.io/npm/v/@web3auth/auth-adapter?label=%22%22)](https://www.npmjs.com/package/@web3auth/auth-adapter/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/auth-adapter?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/auth-adapter@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

This adapter is a wrapper around the [`auth`](https://www.npmjs.com/package/@web3auth/auth) library from Web3Auth (previously Torus) and enables the main social login features of Web3Auth. By default, Web3Auth has
certain configuration set to enable a quick integration, however, for customising features, like Whitelabel,
Custom Authentication, etc. you need to customise the Auth Adapter. With the Auth Adapter package installed and
instantiated, you can explore a number of options and can customise the login experience of the user as per your needs.

## 📖 Documentation

Read more about the Web3Auth Auth Adapter in the [official Web3Auth Documentation](https://web3auth.io/docs/sdk/web/auth).

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

- Adapter Name: `auth`

- Package Name: [`@web3auth/auth-adapter`](https://web3auth.io/docs/sdk/web/auth)

- authMode: `WALLET`, `DAPP`

- chainNamespace: `EIP155`,`SOLANA`

- Default: `YES`

## 🔗 Installation

```shell
npm install --save @web3auth/auth-adapter
```

## 🩹 Example

### Using with `web3auth/web3auth` (Web3Auth Plug and Play Modal Package)

```js
const authAdapter = new AuthAdapter({
  adapterSettings: {
    clientId,
    network: "testnet",
    uxMode: "popup",
    whiteLabel: {
      name: "Your app Name",
      logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
      logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
      defaultLanguage: "en",
      dark: true, // whether to enable dark mode. defaultValue: false
    },
    loginConfig: {
      // Add login configs corresponding to the providers on modal
      // Google login
      google: {
        name: "Custom Auth Login",
        verifier: "YOUR_GOOGLE_VERIFIER_NAME", // Please create a verifier on the developer dashboard and pass the name here
        typeOfLogin: "google", // Pass on the login provider of the verifier you've created
        clientId: "GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Pass on the clientId of the login provider here - Please note this differs from the Web3Auth ClientID. This is the JWT Client ID
      },
      // Facebook login
      facebook: {
        name: "Custom Auth Login",
        verifier: "YOUR_FACEBOOK_VERIFIER_NAME", // Please create a verifier on the developer dashboard and pass the name here
        typeOfLogin: "facebook", // Pass on the login provider of the verifier you've created
        clientId: "FACEBOOK_CLIENT_ID_1234567890", // Pass on the clientId of the login provider here - Please note this differs from the Web3Auth ClientID. This is the JWT Client ID
      },
      // Add other login providers here
    },
  },
  loginSettings: {
    mfaLevel: "mandatory",
  },¯
});
web3auth.configureAdapter(authAdapter);
```

### Using with `web3auth/no-modal` (Web3Auth Plug and Play NoModal Package)

```js
const authAdapter = new AuthAdapter({
  adapterSettings: {
    clientId,
    network: "testnet",
    uxMode: "popup",
    whiteLabel: {
      name: "Your app Name",
      logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
      logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
      defaultLanguage: "en",
      dark: true, // whether to enable dark mode. defaultValue: false
    },
    loginConfig: {
      jwt: {
        name: "Web3Auth-Auth0-JWT",
        verifier: "web3auth-auth0",
        typeOfLogin: "jwt",
        clientId: "294QRkchfq2YaXUbPri7D6PH7xzHgQMT",
      },
    },
  },
});
web3auth.configureAdapter(authAdapter);
```

Check out the examples for your preferred blockchain and platform on our [examples page](https://web3auth.io/docs/examples).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo.web3auth.io) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
