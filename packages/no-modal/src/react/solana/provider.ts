import type { SolanaClient } from "@solana/client";
import { createClient } from "@solana/client";
import { SolanaProvider as SolanaProviderBase } from "@solana/react-hooks";
import { createElement, PropsWithChildren, useEffect, useRef, useState } from "react";

import { CHAIN_NAMESPACES, log } from "../../base";
import type { CustomChainConfig } from "../../base/chain/IChainInterface";
import { createWeb3AuthSolanaClient, WEB3AUTH_SOLANA_CONNECTOR_ID } from "../../solana-framework-kit";
import { useChain, useWeb3Auth } from "../hooks";
import type { SolanaProviderProps } from "./interface";

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
  const { isConnected, provider, web3Auth, isInitialized } = useWeb3Auth();
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

    void (async () => {
      const rpc = placeholderRpc(isInitialized, web3Auth);
      const onSolana =
        isConnected && provider && chainNamespace === CHAIN_NAMESPACES.SOLANA && web3Auth?.currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA;

      if (!onSolana) {
        adopt(makePlaceholder(rpc));
        return;
      }

      try {
        const wired = createWeb3AuthSolanaClient({
          provider,
          chainConfig: web3Auth.currentChain,
        });
        await wired.actions.connectWallet(WEB3AUTH_SOLANA_CONNECTOR_ID, { autoConnect: true });
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
  }, [isConnected, provider, chainNamespace, web3Auth, isInitialized]);

  return client;
}

export function SolanaProvider({ children, ...props }: PropsWithChildren<SolanaProviderProps>) {
  const client = useFrameworkKitSolanaClient();

  return createElement(SolanaProviderBase, {
    ...props,
    client,
    walletPersistence: false,
    children,
  });
}
