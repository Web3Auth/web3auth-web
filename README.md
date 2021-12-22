# `Web3Auth`

What is Web3Auth?

Web3Auth, is pluggable infrastructure that enables Web3 wallets and applications to provide seamless user logins for both mainstream and Web3.0 users. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets, and existing key management solutions, Web3Auth provides dApps/wallets a familiar experience that fits every user.

## Quick Links

----

### Install

Install these dependencies:

```shell
yarn add @web3auth/base 
yarn add @web3auth/modal
```

### Basic Setup

```tsx
import { Web3AuthModal } from "@web3auth/modal";
import { BASE_WALLET_EVENTS, CHAIN_NAMESPACES } from "@web3auth/base";
const web3auth = new Web3AuthModal(CHAIN_NAMESPACES.SOLANA)

await web3auth.initModal();

// calling this function will show modal
login() {
  web3auth.connect()
}
// listening to modal events, on successfull login, `CONNECTED` event will be emitted.
subscribeAuthEvents(web3auth: Web3AuthModal) {
    web3auth.on(BASE_WALLET_EVENTS.CONNECTED, (adapterName: string)=>{
      console.log("connected to wallet", adapterName, web3auth.provider)
    })
    web3auth.on(BASE_WALLET_EVENTS.CONNECTING, ()=>{
      console.log("connecting")

    })
    web3auth.on(BASE_WALLET_EVENTS.DISCONNECTED, ()=>{
      console.log("disconnected")
    })
    web3auth.on(BASE_WALLET_EVENTS.ERRORED, (error)=>{
      console.log("errored", error)
    })
  }
```

### Using Provider

```tsx

```

## Packages
This library is organized into small packages, description about each package is given below:-


| package | description | npm |
| -------- | -------- | -------- |
| [base](https://github.com/web3auth/web3auth/tree/master/packages/base)      | Interfaces, types, utilities and errors     | [`@web3auth/base`](https://npmjs.com/package/@web3auth/base)     |
| [core](https://github.com/web3auth/web3auth/tree/master/packages/core)       | This package acts as a manager for adapters. All the wallet adapters can be imported from this package. It is also used by UI modal and components package to manage with adapters.  | [`@web3auth/core`](https://npmjs.com/package/@web3auth/core)  |
|  [modal](https://github.com/web3auth/web3auth/tree/master/packages/modal) | This package provides UI and functions to manage UI for web3auth modal in native html css.| [`@web3auth/modal`](https://npmjs.com/package/@web3auth/modal) |



## Build from Source

1. Clone the project:
```shell
git clone https://github.com/web3auth/web3auth
```

2. Install dependencies:
```shell
cd web3auth
yarn
yarn run bootstrap
```

3. Build all packages:
```shell
yarn build
```
