import { LANGUAGE_TYPE, LANGUAGES, LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE, WhiteLabelData } from "@toruslabs/openlogin-utils";
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";

export const networkOptions = Object.values(WEB3AUTH_NETWORK).map((x) => ({ name: x, value: x }));

export const chainNamespaceOptions = Object.values(CHAIN_NAMESPACES).map((x) => ({ name: x, value: x }));

export const chainConfigs: Record<ChainNamespaceType, CustomChainConfig[]> = {
  [CHAIN_NAMESPACES.EIP155]: [
    {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      rpcTarget: "https://rpc.ankr.com/eth",
      blockExplorerUrl: "https://etherscan.io",
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
      chainId: "0x1",
      ticker: "ETH",
      tickerName: "Ethereum",
    },
    {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      rpcTarget: "https://data-seed-prebsc-2-s3.binance.org:8545",
      blockExplorerUrl: "https://testnet.bscscan.com",
      logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
      chainId: "0x61",
      displayName: "Binance SmartChain Testnet",
      ticker: "BNB",
      tickerName: "BNB",
    },
    {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      rpcTarget: "https://rpc-mumbai.maticvigil.com",
      blockExplorerUrl: "https://mumbai-explorer.matic.today",
      logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
      chainId: "0x13881",
      displayName: "Polygon Mumbai Testnet",
      ticker: "matic",
      tickerName: "matic",
    },
  ],
  [CHAIN_NAMESPACES.SOLANA]: [
    {
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
      rpcTarget: "https://rpc.ankr.com/solana_devnet",
      blockExplorerUrl: "https://solscan.io",
      logo: "https://cryptologos.cc/logos/solana-sol-logo.png",
      chainId: "0x3",
      ticker: "SOL",
      tickerName: "Solana",
    },
  ],
  [CHAIN_NAMESPACES.CASPER]: [],
  [CHAIN_NAMESPACES.XRPL]: [],
  [CHAIN_NAMESPACES.OTHER]: [],
};

export const clientIds: Record<WEB3AUTH_NETWORK_TYPE, string> = {
  [WEB3AUTH_NETWORK.MAINNET]: "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA",
  [WEB3AUTH_NETWORK.TESTNET]: "BHr_dKcxC0ecKn_2dZQmQeNdjPgWykMkcodEHkVvPMo71qzOV6SgtoN8KCvFdLN7bf34JOm89vWQMLFmSfIo84A",
  [WEB3AUTH_NETWORK.AQUA]: "BM34K7ZqV3QwbDt0lvJFCdr4DxS9gyn7XZ2wZUaaf0Ddr71nLjPCNNYtXuGWxxc4i7ivYdgQzFqKlIot4IWrWCE",
  [WEB3AUTH_NETWORK.CYAN]: "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk",
  [WEB3AUTH_NETWORK.SAPPHIRE_DEVNET]: "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw",
  [WEB3AUTH_NETWORK.SAPPHIRE_MAINNET]: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
  [WEB3AUTH_NETWORK.CELESTE]: "openlogin",
};

export const initWhiteLabel: WhiteLabelData = {
  appName: "HelloDemo",
  appUrl: "http://localhost:8080",
  logoDark: "https://images.web3auth.io/example-hello.svg", // dark logo for light background
  logoLight: "https://images.web3auth.io/example-hello-light.svg", // light logo for dark background
  mode: "auto",
  defaultLanguage: "en",
  theme: {
    primary: "#5DF0EB",
    onPrimary: "black",
  },
};

export const loginProviderOptions = Object.values(LOGIN_PROVIDER)
  .filter((x) => x !== "jwt" && x !== "webauthn")
  .map((x) => ({ name: x.replaceAll("_", " "), value: x }));

export const languageOptions: { name: string; value: LANGUAGE_TYPE }[] = [
  { name: "English", value: LANGUAGES.en },
  { name: "German", value: LANGUAGES.de },
  { name: "Japanese", value: LANGUAGES.ja },
  { name: "Korean", value: LANGUAGES.ko },
  { name: "Mandarin", value: LANGUAGES.zh },
  { name: "Spanish", value: LANGUAGES.es },
  { name: "French", value: LANGUAGES.fr },
  { name: "Portuguese", value: LANGUAGES.pt },
  { name: "Dutch", value: LANGUAGES.nl },
  { name: "Turkish", value: LANGUAGES.tr },
];

export const defaultLoginMethod = loginProviderOptions.reduce(
  (acc, curr) => ({
    ...acc,
    [curr.value]: {
      name: `${curr.name} login`,
      description: "",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: false,
      showOnDesktop: false,
      showOnMobile: false,
    },
  }),
  {},
);

export type FormData = {
  // authMode: string;
  network: WEB3AUTH_NETWORK_TYPE;
  chainNamespace: ChainNamespaceType;
  chain: string;
  whiteLabel: {
    enable: boolean;
    config: WhiteLabelData;
  };
  loginProviders: LOGIN_PROVIDER_TYPE[];
  adapters: string[];
  loginMethods: typeof defaultLoginMethod;
  walletPlugin: {
    enable: boolean;
    logoDark: string;
    logoLight: string;
  };
};
