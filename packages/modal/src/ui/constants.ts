import { WalletRegistryItem } from "@web3auth/no-modal";

export const PAGES = {
  /** Main login options: social logins and wallet button (e.g. MetaMask) */
  LOGIN_OPTIONS: "login",
  /** List of all available wallets to connect */
  WALLET_LIST: "connect_wallet",
  /** QR code or instructions for connecting to the selected wallet */
  WALLET_CONNECTION_DETAILS: "selected_wallet",
};

export const CONNECT_WALLET_PAGES = {
  CONNECT_WALLET: "Connect Your Wallet",
  /** Sub-page title when showing QR/instructions for selected wallet */
  SELECTED_WALLET: "Selected Wallet",
};

export const DEFAULT_LOGO_LIGHT = "https://images.web3auth.io/web3auth-logo-w.svg"; // logo used on light mode
export const DEFAULT_LOGO_DARK = "https://images.web3auth.io/web3auth-logo-w-light.svg"; // logo used on dark mode

export const WALLET_CONNECT_LOGO = "https://images.web3auth.io/login-wallet-connect.svg";

export const DEFAULT_PRIMARY_COLOR = "#0364FF";
export const DEFAULT_ON_PRIMARY_COLOR = "#FFFFFF";

export const DEFAULT_METAMASK_WALLET_REGISTRY_ITEM: WalletRegistryItem = {
  app: {
    android: "io.metamask",
    chrome: "nkbihfbeogaeaoehlefnkodbefgpgknn",
    edge: "ejbalbakoplchlghecdalmeeeajnimhm",
    firefox: "ether-metamask",
    ios: "id1438144202",
  },
  chains: ["eip155:1"],
  imgExtension: "webp",
  injected: [
    {
      injected_id: "isMetaMask",
      namespace: "eip155",
    },
  ],
  mobile: {
    inAppBrowser: "https://metamask.app.link/dapp",
    native: "metamask://wc",
    universal: "https://metamask.app.link/wc",
  },
  name: "MetaMask",
  primaryColor: "#E2761B",
  walletConnect: {
    sdks: ["sign_v1", "sign_v2"],
  },
};
