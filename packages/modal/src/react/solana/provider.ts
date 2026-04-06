import { createClient, createWalletStandardConnector, type SolanaClient } from "@solana/client";
import { SolanaProvider as SolanaProviderBase } from "@solana/react-hooks";
import { CHAIN_NAMESPACES, CustomChainConfig, log } from "@web3auth/no-modal";
import type { ComponentProps } from "react";
import { createElement, PropsWithChildren, useEffect, useState } from "react";

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

/**
 * Builds the SolanaClient for Framework Kit React hooks: placeholder when idle, Web3Auth-backed when
 * connected on Solana. State drives re-renders when the active client instance changes.
 */
function useFrameworkKitSolanaClient(): SolanaClient {
  const { isConnected, connection, web3Auth, isInitialized } = useWeb3Auth();
  const { chainNamespace } = useChain();

  const [client, setClient] = useState<SolanaClient>(() => makePlaceholder({ rpcTarget: DEVNET_ENDPOINT }));

  useEffect(() => {
    if (isInitialized) web3Auth?.setAnalyticsProperties({ solana_framework_kit_enabled: true });
  }, [isInitialized, web3Auth]);

  useEffect(() => {
    let stale = false;

    const adopt = (next: SolanaClient) => {
      if (stale) return;
      setClient((prev) => (prev === next ? prev : next));
    };

    (async () => {
      const rpc = placeholderRpc(isInitialized, web3Auth);
      const solanaWallet = connection?.solanaWallet;
      const onSolana =
        isConnected &&
        Boolean(solanaWallet) &&
        chainNamespace === CHAIN_NAMESPACES.SOLANA &&
        web3Auth?.currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA;

      if (!onSolana) {
        adopt(makePlaceholder(rpc));
        return;
      }

      const conn = connection;
      if (!conn || !solanaWallet) {
        adopt(makePlaceholder(rpc));
        return;
      }

      try {
        const solanaWalletId = "wallet-standard:" + conn.connectorName;
        const connector = createWalletStandardConnector(solanaWallet, {
          id: solanaWalletId,
          name: conn.connectorName,
        });
        const { rpcTarget, wsTarget } = web3Auth.currentChain;
        const wired = createClient({
          endpoint: rpcTarget,
          websocketEndpoint: wsTarget,
          walletConnectors: [connector],
        });
        await wired.actions.connectWallet(solanaWalletId, { autoConnect: true });
        if (stale) return;
        adopt(wired);
      } catch (e) {
        log.error("Failed to create or connect Solana client", e);
        adopt(makePlaceholder(rpc));
      }
    })();

    return () => {
      stale = true;
    };
  }, [isConnected, connection, connection?.solanaWallet, chainNamespace, web3Auth, isInitialized, connection?.connectorName]);

  return client;
}

type SolanaProviderProps = Omit<ComponentProps<typeof SolanaProviderBase>, "client" | "config">;

export function SolanaProvider({ children, ...props }: PropsWithChildren<SolanaProviderProps>) {
  const client = useFrameworkKitSolanaClient();

  return createElement(
    SolanaProviderBase,
    {
      ...props,
      client,
      walletPersistence: false,
    } as ComponentProps<typeof SolanaProviderBase>,
    children
  );
}
