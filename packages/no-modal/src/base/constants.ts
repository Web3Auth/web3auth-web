export const SMART_ACCOUNT_WALLET_SCOPE = {
  EMBEDDED: "embedded",
  ALL: "all",
} as const;

export const MODAL_SIGN_IN_METHODS = {
  SOCIAL: "social",
  PASSWORDLESS: "passwordless",
  EXTERNAL_WALLETS: "externalWallets",
} as const;

export const WIDGET_TYPE = {
  MODAL: "modal",
  EMBED: "embed",
} as const;

export const WEB3AUTH_STATE_STORAGE_KEY = "Web3Auth-state";

export const LOGIN_MODE = {
  MODAL: "modal",
  NO_MODAL: "no-modal",
} as const;

export const SOLANA_CAIP_CHAIN_MAP: Record<string, string> = {
  "0x65": "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "0x66": "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
  "0x67": "EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;
