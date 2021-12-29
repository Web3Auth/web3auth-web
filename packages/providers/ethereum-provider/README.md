##  ``@web3auth/ethereum-provider``
-------------


## Introduction:-

This package exposes a class `EthereumPrivateKeyProvider`, which accepts a `secp251k1` private key and returns  `EIP1193` compatible provider, which can be used with various wallet sdks. For ex: `CustomAuth` and `Openlogin` sdk by torus.

-----------

## Usage:-

> Setting up provider

```
import { CustomChainConfig, EthereumPrivateKeyProvider, PROVIDER_EVENTS } from "@web3auth/ethereum-provider";


const setupProvider = async (params: {
  privKey: string;
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}): Promise<SafeEventEmitterProvider> => {
  const providerFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
  await providerFactory.init();
  return new Promise((resolve, reject) => {
    // check if provider is ready
    if (providerFactory.state._initialized) {
      const provider = providerFactory.setupProvider(params.privKey);
      resolve(provider);
      return;
    }

    // wait for provider to get ready
    providerFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
      const provider = providerFactory.setupProvider(params.privKey);
      resolve(provider);
    });
    providerFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
      reject(error);
    });
  });
};
```

> Using Provider

```

const signEthMessage = async (provider: SafeEventEmitterProvider): Promise<any> => {
  const web3 = new Web3(provider as any);
  const accounts = await (web3.currentProvider as any)?.sendAsync({
    method: "eth_accounts",
    params: [],
  });
  // hex message
  const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
  const jrpcResult = await (web3.currentProvider as any)?.sendAsync({
    method: "eth_sign",
    params: [accounts[0], message],
    from: accounts[0],
  });
  return jrpcResult;
};

(async () => {
  const provider = await setupProvider({
    chainConfig: {
      rpcTarget: "https://polygon-rpc.com",
      chainId: "0x89", // hex chain id
      networkName: "matic",
      ticker: "matic",
      tickerName: "matic",
    },
    privKey: "4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
  });
  const signedMessage = await signEthMessage(provider);
})();

```