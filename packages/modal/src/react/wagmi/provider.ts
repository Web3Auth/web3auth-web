import { CHAIN_NAMESPACES, type CustomChainConfig, IProvider, log, WalletInitializationError } from "@web3auth/no-modal";
import {
  connectWeb3AuthWithWagmi,
  disconnectWeb3AuthFromWagmi,
  getWeb3authConnector,
  resetConnectorState,
  setupConnector,
} from "@web3auth/no-modal/react/wagmi";
import { createElement, Fragment, PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { type Chain, defineChain, http, webSocket } from "viem";
import {
  createConfig as createWagmiConfig,
  type CreateConfigParameters,
  fallback,
  useConfig as useWagmiConfig,
  useConnectionEffect,
  useReconnect,
  WagmiProvider as WagmiProviderBase,
} from "wagmi";

import { useWeb3Auth, useWeb3AuthDisconnect } from "../hooks";
import { defaultWagmiConfig } from "./constants";
import { WagmiProviderProps } from "./interface";

// TODO: re-use the provider from the no-modal package
function Web3AuthWagmiProvider({ children }: PropsWithChildren) {
  const { isConnected, connection, chainNamespace } = useWeb3Auth();
  const { disconnect } = useWeb3AuthDisconnect();
  const wagmiConfig = useWagmiConfig();
  const { mutate: reconnect } = useReconnect();
  const suppressWagmiDisconnect = useRef(false);
  const lastSyncedProvider = useRef<IProvider | null>(connection?.ethereumProvider ?? null);
  const lastSyncedConnectorName = useRef<string | null>(connection?.connectorName ?? null);

  useConnectionEffect({
    onDisconnect: async () => {
      log.info("Disconnected from wagmi");
      const isSuppressed = suppressWagmiDisconnect.current;
      suppressWagmiDisconnect.current = false;
      if (!isSuppressed && isConnected) await disconnect();

      // reset wagmi connector state if the provider handles disconnection because of the accountsChanged event
      // from the connected provider
      if (getWeb3authConnector(wagmiConfig)) {
        resetConnectorState(wagmiConfig);
      }
    },
  });

  useEffect(() => {
    (async () => {
      const newConnection = connection ?? null;
      const newEth = connection?.ethereumProvider ?? null;
      const w3aWagmiConnector = getWeb3authConnector(wagmiConfig);
      const shouldBindToWagmi = isConnected && chainNamespace === CHAIN_NAMESPACES.EIP155 && Boolean(newConnection && newEth);

      if (shouldBindToWagmi) {
        const hasSameBinding =
          lastSyncedProvider.current === newEth &&
          lastSyncedConnectorName.current === newConnection.connectorName &&
          wagmiConfig.state.status === "connected";

        if (hasSameBinding) {
          // rehydration: already connected to the same provider, so no need to reconnect
          return;
        }

        // `ethereumProvider` is a stable proxy (`commonJRPCProvider`) across account switches,
        // so key wagmi resyncs off the Web3Auth connection object instead of provider identity.
        if (w3aWagmiConnector) {
          resetConnectorState(wagmiConfig);
        }

        lastSyncedProvider.current = newEth;
        lastSyncedConnectorName.current = newConnection.connectorName;

        const connector = setupConnector(newEth, wagmiConfig);
        if (!connector) {
          log.error("Failed to setup react wagmi connector");
          throw new Error("Failed to setup connector");
        }

        await connectWeb3AuthWithWagmi(connector, wagmiConfig);
        reconnect();
      } else if (!isConnected || chainNamespace !== CHAIN_NAMESPACES.EIP155) {
        lastSyncedProvider.current = null;
        lastSyncedConnectorName.current = null;
        if (wagmiConfig.state.status === "connected") {
          suppressWagmiDisconnect.current = true;
          await disconnectWeb3AuthFromWagmi(wagmiConfig);
        } else if (w3aWagmiConnector) {
          resetConnectorState(wagmiConfig);
        }
      }
    })();
  }, [chainNamespace, isConnected, wagmiConfig, connection, reconnect]);

  return createElement(Fragment, null, children);
}

export function WagmiProvider({ children, ...props }: PropsWithChildren<WagmiProviderProps>) {
  const { config } = props;
  const { web3Auth, isInitialized } = useWeb3Auth();

  const getTransport = (chain: CustomChainConfig) => {
    const { wsTarget, rpcTarget, fallbackWsTargets = [], fallbackRpcTargets = [] } = chain;
    const transports = [];
    if (wsTarget) transports.push(webSocket(wsTarget));
    if (fallbackWsTargets.length > 0) transports.push(...fallbackWsTargets.map((target) => webSocket(target)));
    if (rpcTarget) transports.push(http(rpcTarget));
    if (fallbackRpcTargets.length > 0) transports.push(...fallbackRpcTargets.map((target) => http(target)));
    return fallback(transports);
  };

  const finalConfig = useMemo(() => {
    web3Auth?.setAnalyticsProperties({ wagmi_enabled: true });
    if (!isInitialized) return defaultWagmiConfig;

    const finalConfig: CreateConfigParameters = {
      ssr: true,
      ...config,
      chains: undefined,
      connectors: [],
      transports: {},
      multiInjectedProviderDiscovery: false,
      client: undefined,
    };

    const wagmiChains: Chain[] = [];
    if (isInitialized && web3Auth?.coreOptions?.chains) {
      const defaultChainId = web3Auth.currentChain?.chainId;
      const chains = web3Auth.coreOptions.chains.filter((chain) => chain.chainNamespace === CHAIN_NAMESPACES.EIP155);
      if (chains.length === 0) throw WalletInitializationError.invalidParams("No valid chains found in web3auth config for wagmi.");

      chains.forEach((chain) => {
        const wagmiChain = defineChain({
          id: Number.parseInt(chain.chainId, 16), // id in number form
          name: chain.displayName,
          rpcUrls: {
            default: {
              http: [chain.rpcTarget],
              webSocket: [chain.wsTarget],
            },
          },
          blockExplorers: chain.blockExplorerUrl
            ? {
                default: {
                  name: "explorer", // TODO: correct name if chain config has it
                  url: chain.blockExplorerUrl,
                },
              }
            : undefined,
          nativeCurrency: {
            name: chain.tickerName,
            symbol: chain.ticker,
            decimals: chain.decimals || 18,
          },
        });

        if (defaultChainId === chain.chainId) {
          wagmiChains.unshift(wagmiChain);
        } else {
          wagmiChains.push(wagmiChain);
        }
        finalConfig.transports[wagmiChain.id] = getTransport(chain);
      });

      finalConfig.chains = [wagmiChains[0], ...wagmiChains.slice(1)];
    }

    return createWagmiConfig(finalConfig);
  }, [config, web3Auth, isInitialized]);

  return createElement(
    WagmiProviderBase,
    // typecast to WagmiProviderPropsBase to avoid type error
    // as we are omitting the config prop from WagmiProviderProps
    // and creating a new config object with the finalConfig
    { ...props, config: finalConfig, reconnectOnMount: false },
    createElement(Web3AuthWagmiProvider, null, children)
  );
}
