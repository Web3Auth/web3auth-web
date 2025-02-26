# Web3Auth Account Abstraction Provider

![npm version](https://img.shields.io/npm/v/@web3auth/account-abstraction-provider.svg)
![minzip](https://badgen.net/bundlephobia/minzip/@web3auth/account-abstraction-provider@latest)

Web3Auth Account Abstraction Provider provides the native account abstraction for your application. This package can be used to generate the ERC 4337 compatible smart account for your application, and provides the necessary methods to interact with the smart account.

## 📖 Documentation

Read more about Web3Auth Account Abstraction Provider in the [official Web3Auth Documentation](https://web3auth.io/docs/sdk/pnp/web/providers/aa-provider).

## 💡 Features

- Plug and Play, OAuth based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Native Account Abstraction support
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for WebAuthn & Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

...and a lot more

## 🔗 Installation

```shell
npm install --save @web3auth/account-abstraction-provider
```

## 🩹 Example

```ts
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const accountAbstractionProvider = new AccountAbstractionProvider({
  config: {
    chainConfig,
    bundlerConfig: {
      url: `https://api.pimlico.io/v2/11155111/rpc?apikey=${pimlicoAPIKey}`,
    },
    smartAccountInit: new SafeSmartAccount(),
    paymasterConfig: {
      url: `https://api.pimlico.io/v2/11155111/rpc?apikey=${pimlicoAPIKey}`,
    },
  },
});

// Use this provider with your preferred Web3Auth Web SDK
```

Checkout the examples for your preferred Web3Auth Web SDK in our [examples repository](https://github.com/Web3Auth/examples/)

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
