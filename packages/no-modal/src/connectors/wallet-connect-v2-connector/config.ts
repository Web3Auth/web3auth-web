import type { EngineTypes, ProposalTypes } from "@walletconnect/types";

import { CHAIN_NAMESPACES, CustomChainConfig } from "../../base";
import { getSiteIcon, getSiteName } from "../utils";
import { IConnectorSettings } from "./interface";

export enum DEFAULT_EIP155_METHODS {
  ETH_SEND_TRANSACTION = "eth_sendTransaction",
  ETH_SIGN_TRANSACTION = "eth_signTransaction",
  ETH_SIGN = "eth_sign",
  PERSONAL_SIGN = "personal_sign",
  ETH_SIGN_TYPED_DATA = "eth_signTypedData",
  ETH_SIGN_TYPED_DATA_V3 = "eth_signTypedData_v3",
  ETH_SIGN_TYPED_DATA_V4 = "eth_signTypedData_v4",
  ADD_ETHEREUM_CHAIN = "wallet_addEthereumChain",
  SWITCH_ETHEREUM_CHAIN = "wallet_switchEthereumChain",
}

export enum DEFAULT_SOLANA_METHODS {
  SIGN_TRANSACTION = "solana_signTransaction",
  SIGN_MESSAGE = "solana_signMessage",
}

export enum DEFAULT_EIP_155_EVENTS {
  ETH_CHAIN_CHANGED = "chainChanged",
  ETH_ACCOUNTS_CHANGED = "accountsChanged",
}

export enum DEFAULT_SOLANA_EVENTS {
  SOL_CHAIN_CHANGED = "chainChanged",
  SOL_ACCOUNTS_CHANGED = "accountsChanged",
}

export const SOLANA_CAIP_CHAIN_MAP: Record<string, string> = {
  "0x65": "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "0x66": "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
  "0x67": "EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
};

/**
 * Gets site metadata and returns it
 *
 */
const getSiteMetadata = async () => ({ name: getSiteName(window), icon: await getSiteIcon(window) });

export const getNamespacesFromChains = (chains: string[]) => {
  const supportedNamespaces: string[] = [];
  chains.forEach((chainId) => {
    const [namespace] = chainId.split(":");
    if (!supportedNamespaces.includes(namespace)) {
      supportedNamespaces.push(namespace);
    }
  });

  return supportedNamespaces;
};

export const getSupportedMethodsByNamespace = (namespace: string) => {
  switch (namespace) {
    case CHAIN_NAMESPACES.EIP155:
      return Object.values(DEFAULT_EIP155_METHODS);
    case CHAIN_NAMESPACES.SOLANA:
      return Object.values(DEFAULT_SOLANA_METHODS);
    default:
      throw new Error(`No default methods for namespace: ${namespace}`);
  }
};

export const getSupportedEventsByNamespace = (namespace: string) => {
  switch (namespace) {
    case CHAIN_NAMESPACES.EIP155:
      return Object.values(DEFAULT_EIP_155_EVENTS);
    case CHAIN_NAMESPACES.SOLANA:
      return Object.values(DEFAULT_SOLANA_EVENTS);
    default:
      throw new Error(`No default events for namespace: ${namespace}`);
  }
};
export const getRequiredNamespaces = (chains: string[]): ProposalTypes.RequiredNamespaces => {
  const selectedNamespaces = getNamespacesFromChains(chains);

  return Object.fromEntries(
    selectedNamespaces.map((namespace) => [
      namespace,
      {
        methods: getSupportedMethodsByNamespace(namespace),
        chains: chains.filter((chain) => chain.startsWith(namespace)),
        events: getSupportedEventsByNamespace(namespace),
      },
    ])
  );
};

export const getWalletConnectV2Settings = async (
  chains: CustomChainConfig[],
  projectID: string
): Promise<{ connectorSettings: IConnectorSettings; loginSettings: EngineTypes.ConnectParams }> => {
  const appMetadata = await getSiteMetadata();
  const connectorSettings: IConnectorSettings = {
    walletConnectInitOptions: {
      projectId: projectID,
      relayUrl: "wss://relay.walletconnect.com",
      metadata: { name: appMetadata.name, description: appMetadata.name, url: window.location.origin, icons: [appMetadata.icon || ""] },
    },
  };

  const chainNamespaces = chains.map((chain) => {
    return `${chain.chainNamespace}:${chain.chainNamespace === CHAIN_NAMESPACES.SOLANA ? SOLANA_CAIP_CHAIN_MAP[chain.chainId] : parseInt(chain.chainId, 16)}`;
  });

  const loginSettings: EngineTypes.ConnectParams = { optionalNamespaces: getRequiredNamespaces(chainNamespaces) };
  return { connectorSettings, loginSettings };
};
