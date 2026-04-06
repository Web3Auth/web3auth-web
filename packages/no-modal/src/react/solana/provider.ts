import type { SolanaClient } from "@solana/client";
import { createClient, createWalletStandardConnector } from "@solana/client";
import { SolanaProvider as SolanaProviderBase } from "@solana/react-hooks";
import type { ComponentProps } from "react";
import { createElement, PropsWithChildren, useEffect, useRef, useState } from "react";

import { CHAIN_NAMESPACES, log } from "../../base";
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
  void client.actions.disconnectWallet().catch(() => {});
  client.destroy();
}

/**
 * Builds the SolanaClient for Framework Kit React hooks: placeholder when idle, Web3Auth-backed when
 * connected on Solana. Ref + state so React re-renders on swap and effects dispose the right instance.
 */
function useFrameworkKitSolanaClient(): SolanaClient {
  const { isConnected, connection, web3Auth, isInitialized } = useWeb3Auth();
  const { chainNamespace } = useChain();

  const ref = useRef<SolanaClient | null>(null);
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
      const c = ref.current;
      if (c) {
        dispose(c);
        ref.current = null;
      }
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
        if (stale) {
          dispose(wired);
          return;
        }
        adopt(wired);
      } catch (e) {
        log.error("Failed to create or connect Solana client", e);
        adopt(makePlaceholder(rpc));
      }
    })();

    return () => {
      stale = true;
    };
  }, [isConnected, connection?.solanaWallet, chainNamespace, web3Auth, isInitialized, connection?.connectorName]);

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
