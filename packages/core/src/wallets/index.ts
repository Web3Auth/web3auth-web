import { CustomChainConfig, TorusEthWalletChainConfig, TorusSolanaWalletChainConfig, Wallet } from "@web3auth/base";
import { LoginSettings, OpenloginAdapter, OpenLoginOptions } from "@web3auth/openlogin-adapter";
import { SolanaWalletAdapter, TorusCtorArgs as SolanaCtorOptions, TorusParams as SolanaParams } from "@web3auth/solana-wallet-adapter";
import { TorusCtorArgs, TorusParams, TorusWalletAdapter } from "@web3auth/torus-wallet-adapter";

import { WALLET_ADAPTERS } from "../constants";

const getTorusEvmWallet = (params: { chainConfig: TorusEthWalletChainConfig; widgetOptions: TorusCtorArgs; initParams: TorusParams }): Wallet => {
  return {
    name: WALLET_ADAPTERS.TORUS_EVM_WALLET,
    adapter: () => {
      const torusAdapter = new TorusWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getTorusSolanaWallet = (params: {
  chainConfig: TorusSolanaWalletChainConfig;
  widgetOptions: SolanaCtorOptions;
  initParams: SolanaParams;
}): Wallet => {
  return {
    name: WALLET_ADAPTERS.TORUS_SOLANA_WALLET,
    adapter: () => {
      const torusAdapter = new SolanaWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getOpenloginWallet = (params: { chainConfig: CustomChainConfig; openLoginOptions: OpenLoginOptions; loginSettings: LoginSettings }): Wallet => {
  return {
    name: WALLET_ADAPTERS.OPENLOGIN_WALLET,
    adapter: () => {
      const torusAdapter = new OpenloginAdapter({ ...params });
      return torusAdapter;
    },
  };
};

export { getOpenloginWallet, getTorusEvmWallet, getTorusSolanaWallet };
