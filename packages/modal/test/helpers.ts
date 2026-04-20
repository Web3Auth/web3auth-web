import { CHAIN_NAMESPACES, type ProjectConfig, WALLET_CONNECTORS, type WalletRegistry } from "@web3auth/no-modal";

export function createModalProjectConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    chainNamespaces: [CHAIN_NAMESPACES.EIP155],
    chains: [
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x1",
        rpcTarget: "https://rpc.ankr.com/eth",
        displayName: "Ethereum Mainnet",
        ticker: "ETH",
        tickerName: "Ethereum",
      },
    ],
    whitelabel: {},
    walletUi: {},
    embeddedWalletAuth: [],
    externalWalletAuth: null,
    loginModal: {},
    teamId: "team-id",
    ...overrides,
  } as ProjectConfig;
}

export function createWalletRegistry(overrides: Partial<WalletRegistry> = {}): WalletRegistry {
  return {
    default: {
      [WALLET_CONNECTORS.METAMASK]: {
        name: "MetaMask",
      },
      [WALLET_CONNECTORS.COINBASE]: {
        name: "Coinbase Wallet",
      },
    },
    others: {
      [WALLET_CONNECTORS.WALLET_CONNECT_V2]: {
        name: "WalletConnect",
      },
    },
    ...overrides,
  } as WalletRegistry;
}

export function createMockLoginModal() {
  return {
    open: () => {},
    initModal: async () => {},
    initExternalWalletContainer: () => {},
    addSocialLogins: () => {},
    addWalletLogins: () => {},
  };
}
