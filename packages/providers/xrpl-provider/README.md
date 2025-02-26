# Web3Auth XRPL Provider

[![npm version](https://img.shields.io/npm/v/@web3auth/xrpl-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/xrpl-provider/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/xrpl-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/xrpl-provider@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Web3Auth XRPL Provider can be used to interact with wallet or connected EVM compatible chain using RPC calls. This is an EIP-1193 compatible JRPC provider. This package exposes a class `XrplPrivateKeyProvider`, which accepts a `xrpl` private key and returns a compatible provider, which can be used with various wallet sdks.

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
npm install --save @web3auth/xrpl-provider
```

## 🩹 Example

```ts
import { XrplPrivateKeyProvider } from "@web3auth/xrpl-provider";
import { SafeEventEmitterProvider, getXRPLChainConfig } from "@web3auth/base";
const signMessage = async (provider: SafeEventEmitterProvider): Promise<string> => {
  const msg = "Hello world";
  const hexMsg = convertStringToHex(msg);
  const { signature } = await provider.request<{ signature: string }>({
    method: "xrpl_signMessage",
    params: {
      message: hexMsg,
    },
  });
  return signature;
};

(async () => {
  const currentChainConfig = getXRPLChainConfig("testnet");
  const xrplProvider = new XrplPrivateKeyProvider({ config: { chainConfig: currentChainConfig } });
  const secp256k1Key = "WEB3AUTH_LOGIN_KEY";
  const provider = await xrplProvider.setupProvider(secp256k1Key);
  const signedMessage = await signMessage(provider);
})();
```

Checkout the full example [here](https://github.com/Web3Auth/web3auth-web/demo/xrpl-react-app)

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
