# `Web3Auth`

What is Web3Auth?

Web3Auth, is pluggable infrastructure that enables Web3 wallets and applications to provide seamless user logins for both mainstream and Web3.0 users. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets, and existing key management solutions, Web3Auth provides dApps/wallets a familiar experience that fits every user.

### Official Documentation

- https://docs.web3auth.io

---

### Install

Install these dependencies:

```shell
yarn add @web3auth/base
yarn add @web3auth/web3auth
```

### Basic Setup

```tsx
 import { Web3Auth } from "@web3auth/web3auth";
 import { CHAIN_NAMESPACES, ADAPTER_EVENTS } from "@web3auth/base";

 (async () => {
    // We are initializing with EIP155 namespace which
    // will initialize the modal with ethereum mainnet
    // by default.
    const web3auth = new Web3Auth({
        chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
        clientId: "localhost-id" // get your clientId from https://developer.web3auth.io
    });

    await web3auth.initModal();
    // listening to modal events, on successful login, `CONNECTED` event will be emitted.
    subscribeAuthEvents(web3auth: Web3AuthModal) {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (adapterName: string)=>{
        console.log("connected to wallet", adapterName, web3auth.provider)
      })
      web3auth.on(ADAPTER_EVENTS.CONNECTING, ()=>{
        console.log("connecting")

      })
      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, ()=>{
        console.log("disconnected")
      })
      web3auth.on(ADAPTER_EVENTS.ERRORED, (error)=>{
        console.log("errored", error)
      })
    }

    // you can use this provider with web3
    const provider = await web3auth.connect();
 })()

```
