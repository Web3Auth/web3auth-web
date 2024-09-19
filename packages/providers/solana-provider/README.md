# Web3Auth Solana Provider

[![npm version](https://img.shields.io/npm/v/@web3auth/solana-provider?label=%22%22)](https://www.npmjs.com/package/@web3auth/solana-provider/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/solana-provider?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/solana-provider@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Web3Auth Solana Provider can be used to interact with wallet or connected Solana chain using RPC calls. This is a Solana chain compatible JRPC provider.

## 📖 Documentation

Read more about Web3Auth Solana Provider in the [official Web3Auth Documentation](https://web3auth.io/docs/sdk/web/providers/solana#getting-a-provider-from-any-secp256k1-private-key).

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
npm install --save @web3auth/solana-provider
```

## 🩹 Example

### `SolanaPrivateKeyProvider`

```ts
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";

const solanaPrivateProvider = await SolanaPrivateKeyProvider.getProviderInstance({
  chainConfig: {
    rpcTarget: "https://ssc-dao.genesysgo.net",
    chainId: "0x1", // hex chain id
    displayName: "solana",
    ticker: "SOL",
    tickerName: "Solana",
  },
  privKey: "user's private key",
});
```

### `SolanaWallet`

`SolanaWallet` can be used with two types of providers:

1. `web3auth.provider` that you get after logging in with Web3Auth.
2. `solanaPrivateProvider.provider` that you get after passing user's private key to `SolanaPrivateKeyProvider`.

`web3auth.provider`

```ts
import { SolanaWallet } from "@web3auth/solana-provider";

const solanaWallet = new SolanaWallet(web3auth.provider);
const msg = Buffer.from("Signing Message", "utf8");
const result = await solanaWallet.signMessage(msg);
return result;
```

`solanaPrivateProvider.provider`

```ts
import { SolanaWallet } from "@web3auth/solana-provider";

const solanaWallet = new SolanaWallet(solanaPrivateProvider.provider);
const msg = Buffer.from("Signing Message", "utf8");
const result = await solanaWallet.signMessage(msg);
return result.toString();
```

### General Example

```ts
import { SolanaPrivateKeyProvider, SolanaWallet } from "@web3auth/solana-provider";
import type { SafeEventEmitterProvider } from "@web3auth/base";

const signSolanaMessage = async (provider: SafeEventEmitterProvider): Promise<string> => {
  const solanaWallet = new SolanaWallet(provider as any);
  const msg = Buffer.from("Signing Message", "utf8");
  const result = await solanaWallet.signMessage(msg);
  return result.toString();
};

(async () => {
  // Assuming you're logged in with Web3Auth.
  const privateKey = await web3auth.provider.request({
    method: "solanaPrivateKey",
  });
  const solanaPrivateProvider = await SolanaPrivateKeyProvider.getProviderInstance({
    chainConfig: {
      rpcTarget: "https://ssc-dao.genesysgo.net",
      chainId: "0x1", // hex chain id
      displayName: "solana",
      ticker: "SOL",
      tickerName: "Solana",
    },
    privKey: privateKey,
  });
  const signedMessage = await signSolanaMessage(solanaPrivateProvider.provider);
})();
```

Check out the examples for your preferred blockchain and platform on our [examples page](https://web3auth.io/docs/examples).

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo.web3auth.io) to see how Web3Auth can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
