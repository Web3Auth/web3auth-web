# Web3Auth

Web3Auth is a pluggable auth infrastructure for Web3 wallets and applications. It streamlines the onboarding of both mainstream and crypto native
users under a minute by providing experiences that they're most comfortable with. With support for all social logins, web & mobile native platforms,
wallets and other key management methods, **Web3Auth results in a standard cryptographic key provider specific to the user and application.**


### Checkout the official [Web3Auth Documentation](https://docs.web3auth.io) and [API Reference](https://docs.web3auth.io/api-reference) to get started!

## Choosing Between SDKs

For using Web3Auth you have multiple choices to get started with. If you're just starting up and want to experience how it will look like within your
application, we recommend you to use our **Plug n Play SDK [`@web3auth/web3auth`](https://npmjs.com/package/@web3auth/web3auth)** which is a simple
and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. For more customised usage, we
have our **Custom Login UI Module [`@web3auth/core`](https://npmjs.com/package/@web3auth/core)**, which is the core module implemeting the features
you need and giving you the flexibilty of using your own UI with the Web3Auth SDK working in the backend.

## Plug n Play SDK

---

### [`@web3auth/web3auth`](https://npmjs.com/package/@web3auth/web3auth)

This package provides main class for using default web3auth modal. It is a child class of `@web3auth/core` package. So you can still call all the
functions available in the `@web3auth/core` api reference. The package includes all of our packages and gives you a simple way of implementing
Web3Auth within your interface.

Head on to the [Plug n Play API Reference](https://docs.web3auth.io/api-reference/web/plugnplay) to get started.

## Custom Login UI SDK

---

### [`@web3auth/core`](https://npmjs.com/package/@web3auth/core)

This package provides the core logic for handling adapters within web3auth. This package acts as a manager for all the adapters. You should use this
package to build your custom login UI on top of web3auth.

Head on to the [Custom Login UI API Reference](https://docs.web3auth.io/api-reference/web/customloginui) to get started.

## Other packages included in our SDK

---

### [`@web3auth/base`](https://npmjs.com/package/@web3auth/base)

This package gives access to common types and interfaces for web3auth. It is included as a dependency in both our Custom UI and Plug n Play SDKs.

### [`@web3auth/ui`](https://npmjs.com/package/@web3auth/ui)

This package includes the default Web3Auth modal UI for modular access within the Plug n Play SDK. It is included as a dependency in our Plug n Play
SDK.

## Adapter packages

---

Adapter acts as a connector between the Web3Auth and underlying wallet provider. Every adapter follows a common interface which is required by
Web3Auth to communicate with the wallet.

To understand what they are and what they're for: Check out [Adapters](https://docs.web3auth.io/api-reference/web/adapters/)

Currently we have the following adapters available for utilisation:

- [`@web3auth/openlogin-adapter`](https://npmjs.com/package/@web3auth/openlogin-adapter)
- [`@web3auth/phantom-adapter`](https://npmjs.com/package/@web3auth/phantom-adapter)
- [`@web3auth/torus-evm-adapter`](https://npmjs.com/package/@web3auth/torus-evm-adapter)
- [`@web3auth/torus-solana-adapter`](https://npmjs.com/package/@web3auth/torus-solana-adapter)
- [`@web3auth/metamask-adapter`](https://npmjs.com/package/@web3auth/metamask-adapter)
- [`@web3auth/wallet-connect-v1-adapter`](https://npmjs.com/package/@web3auth/wallet-connect-v1-adapter)

## Provider packages

---

Each adapter in web3auth exposes a provider on successful user authentication. This provider can be use to interact with wallet or connected chain
using rpc calls. Currently web3auth supports providers for both EVM and Solana chains. For other chains, one can easily get the private key from the
web3auth SDK. You can learn more about providers [here](https://docs.web3auth.io/api-reference/web/providers/).

- [`@web3auth/ethereum-adapter`](https://www.npmjs.com/package/@web3auth/ethereum-provider)
- [`@web3auth/solana-adapter`](https://www.npmjs.com/package/@web3auth/solana-provider)
