import type { EngineTypes, ProposalTypes } from "@walletconnect/types";
import { CHAIN_NAMESPACES, ChainNamespaceType, IWalletConnectExtensionAdapter } from "@web3auth/base";

import { IAdapterSettings } from "./interface";

export const WALLET_CONNECT_EXTENSION_ADAPTERS: IWalletConnectExtensionAdapter[] = [
  {
    name: "Argent",
    chains: [CHAIN_NAMESPACES.EIP155],
    logo: "https://images.web3auth.io/login-argent.svg",
    mobile: {
      native: "argent://",
      universal: "https://www.argent.xyz/app",
    },
    desktop: {
      native: "",
      universal: "",
    },
  },
  {
    name: "Trust Wallet",
    chains: [CHAIN_NAMESPACES.EIP155],
    logo: "https://images.web3auth.io/login-trust.svg",
    mobile: {
      native: "trust:",
      universal: "https://link.trustwallet.com",
    },
    desktop: {
      native: "",
      universal: "",
    },
  },
  {
    name: "Zerion",
    chains: [CHAIN_NAMESPACES.EIP155],
    logo: "https://images.web3auth.io/login-zerion.svg",
    mobile: {
      native: "zerion://",
      universal: "https://wallet.zerion.io",
    },
    desktop: {
      native: "",
      universal: "",
    },
  },
];

export enum DEFAULT_EIP155_METHODS {
  ETH_SEND_TRANSACTION = "eth_sendTransaction",
  ETH_SIGN = "eth_sign",
  PERSONAL_SIGN = "personal_sign",
  ETH_SIGN_TYPED_DATA = "eth_signTypedData",
}

export enum DEFAULT_EIP_155_EVENTS {
  ETH_CHAIN_CHANGED = "chainChanged",
  ETH_ACCOUNTS_CHANGED = "accountsChanged",
}

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
const getSiteMetadata = async () => ({
  name: getSiteName(window),
  icon: await getSiteIcon(window),
});

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
    default:
      throw new Error(`No default methods for namespace: ${namespace}`);
  }
};

export const getSupportedEventsByNamespace = (namespace: string) => {
  switch (namespace) {
    case CHAIN_NAMESPACES.EIP155:
      return Object.values(DEFAULT_EIP_155_EVENTS);
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
        events: getSupportedEventsByNamespace(namespace) as any[],
      },
    ])
  );
};

export const getWalletConnectV2Settings = async (
  namespace: ChainNamespaceType,
  chainIds: number[],
  projectID: string
): Promise<{
  adapterSettings: IAdapterSettings;
  loginSettings: EngineTypes.ConnectParams;
}> => {
  if (namespace === CHAIN_NAMESPACES.EIP155) {
    const appMetadata = await getSiteMetadata();
    const adapterSettings: IAdapterSettings = {
      walletConnectInitOptions: {
        projectId: projectID,
        relayUrl: "wss://relay.walletconnect.com",
        metadata: {
          name: appMetadata.name,
          description: appMetadata.name,
          url: window.location.origin,
          icons: [appMetadata.icon || ""],
        },
      },
    };

    const chainNamespaces = chainIds.map((chainId) => {
      return `${namespace}:${chainId}`;
    });

    const loginSettings: EngineTypes.ConnectParams = {
      requiredNamespaces: getRequiredNamespaces(chainNamespaces),
    };
    return {
      adapterSettings,
      loginSettings,
    };
  }
  throw new Error(`Unsupported chain namespace: ${namespace}`);
};
