import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";

export const DEFAULT_CHAIN_CONFIG: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x5",
  rpcTarget: "https://rpc.ankr.com/eth_goerli",
  displayName: "Goerli Testnet",
  blockExplorer: "https://goerli.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  decimals: 18,
};

export const WEB3AUTH_NETWORK = {
  MAINNET: "mainnet",
  TESTNET: "testnet",
} as const;

export const USER_PATH = {
  NEW: "NewAccount",
  EXISTING: "ExistingAccount",
  REHYDRATE: "RehydrateAccount",
  RECOVER: "RecoverAccount",
} as const;

export enum FactorKeyTypeShareDescription {
  SecurityQuestions = "securityQuestions",
  DeviceShare = "deviceShare",
  SeedPhrase = "seedPhrase",
  PasswordShare = "passwordShare",
}

export const DELIMITERS = {
  Delimiter1: "\u001c",
  Delimiter2: "\u0015",
  Delimiter3: "\u0016",
  Delimiter4: "\u0017",
};

export const ERRORS = {
  TKEY_SHARES_REQUIRED: "required more shares",
  INVALID_BACKUP_SHARE: "invalid backup share",
};
