import type { SolanaClient } from "@solana/client";
import { createClient, createWalletStandardConnector } from "@solana/client";
import { SolanaProvider as SolanaProviderBase } from "@solana/react-hooks";
import type { ComponentProps } from "react";
import { createElement, PropsWithChildren, useEffect, useRef, useState } from "react";

import { CHAIN_NAMESPACES, type Connection, getCaipChainId, log } from "../../base";
import type { CustomChainConfig } from "../../base/chain/IChainInterface";
import { useChain, useWeb3Auth } from "../hooks";

const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

function placeholderRpc(
  isInitialized: boolean,
  web3Auth: ReturnType<typeof useWeb3Auth>["web3Auth"]
): Pick<CustomChainConfig, "rpcTarget" | "wsTarget"> {
  if (!isInitialized || !web3Auth?.coreOptions?.chains) {
    return { rpcTarget: DEVNET_ENDPOINT };
  }
  const solanaChains = web3Auth.coreOptions.chains.filter((c) => c.chainNamespace === CHAIN_NAMESPACES.SOLANA);
  const current = web3Auth.currentChain;
  const chain = current?.chainNamespace === CHAIN_NAMESPACES.SOLANA ? current : solanaChains[0];
  if (!chain) return { rpcTarget: DEVNET_ENDPOINT };
  return { rpcTarget: chain.rpcTarget, wsTarget: chain.wsTarget };
}

function makePlaceholder(rpc: Pick<CustomChainConfig, "rpcTarget" | "wsTarget">): SolanaClient {
  return createClient({
    endpoint: rpc.rpcTarget,
    websocketEndpoint: rpc.wsTarget,
    walletConnectors: [],
  });
}

function dispose(client: SolanaClient) {
  client.destroy();
}

function resolveSolanaChain(web3Auth: ReturnType<typeof useWeb3Auth>["web3Auth"], connection: Connection | null) {
  const currentChain = web3Auth?.currentChain;
  if (currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return currentChain;
  }

  const connectedScope =
    connection?.solanaWallet && "scope" in connection.solanaWallet && typeof connection.solanaWallet.scope === "string"
      ? connection.solanaWallet.scope
      : null;

  if (connectedScope) {
    const connectedChain = web3Auth?.coreOptions.chains?.find((chain) => {
      return chain.chainNamespace === CHAIN_NAMESPACES.SOLANA && getCaipChainId(chain) === connectedScope;
    });
    if (connectedChain) return connectedChain;
  }

  return web3Auth?.coreOptions.chains?.find((chain) => chain.chainNamespace === CHAIN_NAMESPACES.SOLANA) || null;
}

/**
 * Builds the SolanaClient for Framework Kit React hooks.
 * For multichain wallets, keep the Solana client warm across namespace switches so
 * switching back to Solana can reuse the existing wallet session.
 */
function useFrameworkKitSolanaClient(): SolanaClient {
  const { isConnected, connection, web3Auth, isInitialized } = useWeb3Auth();
  const { chainId, chainNamespace } = useChain();

  const ref = useRef<SolanaClient | null>(null);
  const connectedClientRef = useRef<SolanaClient | null>(null);
  const connectedClientKeyRef = useRef<string | null>(null);
  const [client, setClient] = useState<SolanaClient>(() => {
    const c = makePlaceholder({ rpcTarget: DEVNET_ENDPOINT });
    ref.current = c;
    return c;
  });

  useEffect(() => {
    if (isInitialized) web3Auth?.setAnalyticsProperties({ solana_framework_kit_enabled: true });
  }, [isInitialized, web3Auth]);

  useEffect(
    () => () => {
      const connectedClient = connectedClientRef.current;
      const c = ref.current;
      if (c) {
        dispose(c);
        ref.current = null;
      }
      if (connectedClient && connectedClient !== c) {
        dispose(connectedClient);
      }
      connectedClientRef.current = null;
      connectedClientKeyRef.current = null;
    },
    []
  );

  useEffect(() => {
    let stale = false;

    const adopt = (next: SolanaClient) => {
      if (stale) {
        dispose(next);
        return;
      }
      const prev = ref.current;
      if (prev === next) return;
      if (prev) dispose(prev);
      ref.current = next;
      setClient(next);
    };

    (async () => {
      const rpc = placeholderRpc(isInitialized, web3Auth);
      const conn = connection;
      const currentChain = web3Auth?.currentChain;
      const preferredSolanaChain = resolveSolanaChain(web3Auth, conn);
      const shouldKeepSolanaClient =
        isConnected &&
        Boolean(conn?.solanaWallet) &&
        Boolean(preferredSolanaChain) &&
        // only manage the client for the primary connector
        conn?.connectorName === web3Auth?.primaryConnectorName;

      if (!shouldKeepSolanaClient) {
        connectedClientKeyRef.current = null;
        const connectedClient = connectedClientRef.current;
        connectedClientRef.current = null;
        if (connectedClient) {
          dispose(connectedClient);
        }
        adopt(makePlaceholder(rpc));
        return;
      }

      const nextClientKey = [
        conn.connectorName,
        preferredSolanaChain.chainId,
        preferredSolanaChain.rpcTarget,
        preferredSolanaChain.wsTarget || "",
      ].join(":");

      if (connectedClientRef.current && connectedClientKeyRef.current === nextClientKey) {
        if (chainNamespace === CHAIN_NAMESPACES.SOLANA && currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
          adopt(connectedClientRef.current);
        } else {
          adopt(makePlaceholder(rpc));
        }
        return;
      }

      try {
        const solanaWalletId = "wallet-standard:" + conn.connectorName;
        const connector = createWalletStandardConnector(conn.solanaWallet, {
          id: solanaWalletId,
          name: conn.connectorName,
        });
        const { rpcTarget, wsTarget } = preferredSolanaChain;
        const wired = createClient({
          endpoint: rpcTarget,
          websocketEndpoint: wsTarget,
          walletConnectors: [connector],
        });
        await wired.actions.connectWallet(solanaWalletId, { autoConnect: true });
        if (stale) {
          dispose(wired);
          return;
        }
        const prevConnectedClient = connectedClientRef.current;
        connectedClientRef.current = wired;
        connectedClientKeyRef.current = nextClientKey;
        if (chainNamespace === CHAIN_NAMESPACES.SOLANA && currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
          adopt(wired);
        } else {
          adopt(makePlaceholder(rpc));
        }
        if (prevConnectedClient && prevConnectedClient !== wired) {
          dispose(prevConnectedClient);
        }
      } catch (e) {
        log.error("Failed to create or connect Solana client", e);
        adopt(makePlaceholder(rpc));
      }
    })();

    return () => {
      stale = true;
    };
  }, [isConnected, connection?.solanaWallet, chainId, chainNamespace, web3Auth, isInitialized, connection?.connectorName]);

  return client;
}

type SolanaProviderProps = Omit<ComponentProps<typeof SolanaProviderBase>, "client" | "config">;

export function SolanaProvider({ children, ...props }: PropsWithChildren<SolanaProviderProps>) {
  const client = useFrameworkKitSolanaClient();

  return createElement(SolanaProviderBase, {
    ...props,
    client,
    walletPersistence: false,
    children,
  });
}
