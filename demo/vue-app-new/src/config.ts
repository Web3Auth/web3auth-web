import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE, BUILD_ENV, type BUILD_ENV_TYPE, LANGUAGE_TYPE, LANGUAGES, WhiteLabelData } from "@web3auth/auth";
import {
  CHAIN_NAMESPACES,
  CONFIRMATION_STRATEGY,
  type CONFIRMATION_STRATEGY_TYPE,
  type ConnectorInitialAuthenticationModeType,
  LoginMethodConfig,
  ModalConfig,
  SignTypedDataMessageV4,
  WEB3AUTH_NETWORK,
  WEB3AUTH_NETWORK_TYPE,
  type WidgetType,
} from "@web3auth/modal";

export const networkOptions = Object.values(WEB3AUTH_NETWORK).map((x) => ({ name: x, value: x }));

const allBuildEnvs = Object.values(BUILD_ENV) as BUILD_ENV_TYPE[];

export const buildEnvOptions: { name: string; value: BUILD_ENV_TYPE }[] = allBuildEnvs.map((value) => ({
  name: value.toUpperCase(),
  value,
}));

const buildEnvValues = new Set<BUILD_ENV_TYPE>(allBuildEnvs);

export const resolveBuildEnv = (value?: string): BUILD_ENV_TYPE => {
  if (value && buildEnvValues.has(value as BUILD_ENV_TYPE)) return value as BUILD_ENV_TYPE;
  return BUILD_ENV.TESTING;
};

export const supportedChainNamespaces = [CHAIN_NAMESPACES.EIP155, CHAIN_NAMESPACES.SOLANA] as const;

export type SupportedChainNamespace = (typeof supportedChainNamespaces)[number];

export const chainNamespaceOptions: { name: SupportedChainNamespace; value: SupportedChainNamespace }[] = supportedChainNamespaces.map((value) => ({
  name: value,
  value,
}));

export const isSupportedChainNamespace = (value: unknown): value is SupportedChainNamespace =>
  supportedChainNamespaces.includes(value as SupportedChainNamespace);

export const chainConfigs: Record<SupportedChainNamespace, string[]> = {
  [CHAIN_NAMESPACES.EIP155]: ["0x1", "0xaa36a7", "0x2105", "0x14a34", "0x61", "0x13882"],
  [CHAIN_NAMESPACES.SOLANA]: ["0x65", "0x67"],
};

export const sanitizeChainNamespaces = (chainNamespaces?: unknown[]): SupportedChainNamespace[] => {
  const filtered = (chainNamespaces || []).filter(isSupportedChainNamespace);
  return filtered.length > 0 ? filtered : [...supportedChainNamespaces];
};

export const sanitizeChains = (chainNamespaces: SupportedChainNamespace[], chains?: string[]): string[] => {
  const allowedChains = new Set(chainNamespaces.flatMap((namespace) => chainConfigs[namespace]));
  const filteredChains = (chains || []).filter((chainId) => allowedChains.has(chainId));

  return filteredChains.length > 0 ? filteredChains : chainNamespaces.map((namespace) => chainConfigs[namespace][0]);
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
  appUrl: window.location.origin,
  logoDark: "https://images.web3auth.io/example-hello.svg", // dark logo for light background
  logoLight: "https://images.web3auth.io/example-hello-light.svg", // light logo for dark background
  mode: "auto",
  defaultLanguage: "en",
  theme: {
    primary: "#5DF0EB",
    onPrimary: "black",
  },
};

export const loginProviderOptions = Object.values(AUTH_CONNECTION)
  .filter((x) => x !== "custom" && x !== "authenticator" && x !== "passkeys")
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
  { name: "Amharic", value: LANGUAGES.am },
];

export type ConsentConfigMode = "required" | "disabled";

export const consentConfigOptions: { name: string; value: ConsentConfigMode }[] = [
  { name: "Required", value: "required" },
  { name: "Disabled", value: "disabled" },
];

export const defaultLoginMethod: Record<AUTH_CONNECTION_TYPE, ModalConfig> = loginProviderOptions.reduce(
  (acc, curr) => ({
    ...acc,
    [curr.value]: {
      name: `${curr.name} login`,
      description: "",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      label: "",
    } as LoginMethodConfig[AUTH_CONNECTION_TYPE],
  }),
  {} as Record<AUTH_CONNECTION_TYPE, ModalConfig>
);

export type SmartAccountType = "biconomy" | "safe" | "nexus" | "kernel" | "trust" | "metamask";

export const SmartAccountOptions: { name: string; value: SmartAccountType }[] = [
  { name: "Biconomy", value: "biconomy" },
  { name: "Safe", value: "safe" },
  { name: "Nexus", value: "nexus" },
  { name: "Kernel", value: "kernel" },
  { name: "Trust", value: "trust" },
  { name: "Metamask", value: "metamask" },
  // { name: "Light", value: "light" },
  // { name: "Simple", value: "simple" },
];

export const getDefaultBundlerUrl = (chainId: string): string => {
  return `https://api.pimlico.io/v2/${Number(chainId)}/rpc?apikey=${import.meta.env.VITE_APP_PIMLICO_API_KEY}`;
};

export type FormData = {
  // authMode: string;
  network: WEB3AUTH_NETWORK_TYPE;
  authBuildEnv: BUILD_ENV_TYPE;
  chainNamespaces: SupportedChainNamespace[];
  chains: string[];
  defaultChainId?: string;
  whiteLabel: {
    enable: boolean;
    config: WhiteLabelData;
    hideSuccessScreen: boolean;
  };
  connectors: string[];
  initialAuthenticationMode: ConnectorInitialAuthenticationModeType;
  consentConfigMode: ConsentConfigMode;
  loginProviders: AUTH_CONNECTION_TYPE[];
  showWalletDiscovery: boolean;
  multiInjectedProviderDiscovery: boolean;
  externalWalletOnly: boolean;
  loginMethods: LoginMethodConfig;
  walletPlugin: {
    enable: boolean;
    confirmationStrategy: Exclude<CONFIRMATION_STRATEGY_TYPE, "popup">;
  };
  useAccountAbstractionProvider: boolean;
  useAAWithExternalWallet?: boolean;
  smartAccountType?: SmartAccountType;
  smartAccountChains: string[];
  smartAccountChainsConfig: Record<string, { bundlerUrl: string; paymasterUrl: string }>;
  tokenStorage: "default" | "local" | "session" | "cookies" | "memory";
  widget?: WidgetType;
  targetId?: string;
};

export const getV4TypedData = (chainId: string): SignTypedDataMessageV4 => ({
  types: {
    // EIP712Domain: [
    //   {
    //     name: "name",
    //     type: "string",
    //   },
    //   {
    //     name: "version",
    //     type: "string",
    //   },
    //   {
    //     name: "chainId",
    //     type: "uint256",
    //   },
    //   {
    //     name: "verifyingContract",
    //     type: "address",
    //   },
    // ],
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" },
    ],
  },
  domain: {
    name: "Ether Mail",
    version: "1",
    chainId: Number(chainId),
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
  },
  message: {
    from: {
      name: "Cow",
      wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
    },
    to: {
      name: "Bob",
      wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    },
    contents: "Hello, Bob!",
  },
});

export const confirmationStrategyOptions: { name: string; value: string }[] = [
  { name: "Modal", value: CONFIRMATION_STRATEGY.MODAL },
  { name: "Auto Approve", value: CONFIRMATION_STRATEGY.AUTO_APPROVE },
  { name: "Default", value: CONFIRMATION_STRATEGY.DEFAULT },
];
