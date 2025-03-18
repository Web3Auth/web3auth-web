import type { EngineTypes, ProposalTypes } from "@walletconnect/types";

import { CHAIN_NAMESPACES, CustomChainConfig } from "@/core/base";

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
 * Extracts a name for the site from the DOM
 */
const getSiteName = (window: Window) => {
  const { document } = window;

  const siteName = document.querySelector<HTMLMetaElement>('head > meta[property="og:site_name"]');
  if (siteName) {
    return siteName.content;
  }

  const metaTitle = document.querySelector<HTMLMetaElement>('head > meta[name="title"]');
  if (metaTitle) {
    return metaTitle.content;
  }

  if (document.title && document.title.length > 0) {
    return document.title;
  }

  return window.location.hostname;
};

/**
 * Returns whether the given image URL exists
 * @param url - the url of the image
 * @returns - whether the image exists
 */
function imgExists(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const img = document.createElement("img");
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Extracts an icon for the site from the DOM
 */
async function getSiteIcon(window: Window): Promise<string | null> {
  const { document } = window;

  // Use the site's favicon if it exists
  let icon = document.querySelector<HTMLLinkElement>('head > link[rel="shortcut icon"]');
  if (icon && (await imgExists(icon.href))) {
    return icon.href;
  }

  // Search through available icons in no particular order
  icon = Array.from(document.querySelectorAll<HTMLLinkElement>('head > link[rel="icon"]')).find((_icon) => Boolean(_icon.href)) || null;
  if (icon && (await imgExists(icon.href))) {
    return icon.href;
  }

  return null;
}

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
