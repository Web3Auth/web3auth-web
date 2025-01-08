import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { createApp } from "vue";

import App from "./App.vue";
import { createWeb3Auth } from "./lib/createWeb3Auth";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const walletServicesPlugin = new WalletServicesPlugin();

createApp(App)
  .use(
    createWeb3Auth({
      web3AuthOptions: {
        clientId,
        privateKeyProvider,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        // uiConfig: enabledWhiteLabel ? { ...whiteLabel } : undefined,
        // TODO: Add more options
        // chainConfig?: CustomChainConfig;
        // enableLogging?: boolean;
        // storageKey?: "session" | "local";
        // sessionTime?: number;
        // useCoreKitKey?: boolean;
        enableLogging: true,
      },
      // modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
      // adapters?: IAdapter<unknown>[];
      plugins: [walletServicesPlugin],
    })
  )
  .mount("#app");
