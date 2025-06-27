"use client";

import { CHAIN_NAMESPACES, log, WalletInitializationError } from "@web3auth/no-modal";
import { createElement, Fragment, PropsWithChildren, useEffect, useMemo } from "react";
import { type Chain, defineChain, http, webSocket } from "viem";
import {
  Config,
  Connection,
  Connector,
  cookieStorage,
  createConfig as createWagmiConfig,
  type CreateConfigParameters,
  CreateConnectorFn,
  createStorage,
  useAccountEffect,
  useConfig as useWagmiConfig,
  useReconnect,
  WagmiProvider as WagmiProviderBase,
} from "wagmi";

import { useWeb3Auth, useWeb3AuthDisconnect } from "../hooks";
import { createWeb3AuthConnector, WEB3AUTH_CONNECTOR_ID } from "./connector";
import { defaultWagmiConfig } from "./constants";
import { WagmiProviderProps } from "./interface";

// Helper to initialize connectors for the given wallets
async function setupConnector(config: Config) {
  const connector: Connector | CreateConnectorFn = config.connectors.find((c) => c.id === WEB3AUTH_CONNECTOR_ID);

  if (connector) return connector;
}

// Helper to connect a wallet and update wagmi state
async function connectWeb3AuthWithWagmi(connector: Connector, config: Config) {
  await Promise.all([config.storage?.removeItem(`${connector.id}.disconnected`), config.storage?.setItem("recentConnectorId", connector.id)]);

  let chainId = await connector.getChainId();
  if (!config.chains.find((c) => c.id === chainId)) {
    chainId = config.chains[0].id;
  }

  const accounts = await connector.getAccounts();

  const connections: Map<string, Connection> = new Map([
    [
      connector.uid,
      {
        accounts: [accounts[0]],
        chainId,
        connector,
      },
    ],
  ]);

  config.setState((state) => ({
    ...state,
    chainId,
    connections,
    current: connector.uid,
    status: "connected",
  }));
}

async function disconnectWeb3AuthFromWagmi(config: Config) {
  config._internal.connectors.setState((prev) => prev.filter((c) => c.id !== WEB3AUTH_CONNECTOR_ID));
  config.setState((state) => ({
    ...state,
    chainId: state.chainId,
    connections: new Map(),
    current: undefined,
    status: "disconnected",
  }));
}

function Web3AuthWagmiProvider({ children }: PropsWithChildren) {
  const { isConnected, provider } = useWeb3Auth();
  const { disconnect } = useWeb3AuthDisconnect();
  const wagmiConfig = useWagmiConfig();
  const { reconnect } = useReconnect();

  useAccountEffect({
    onDisconnect: async () => {
      log.info("Disconnected from wagmi");
      if (isConnected) await disconnect();
    },
  });

  useEffect(() => {
    (async () => {
      if (isConnected && provider) {
        const connector = await setupConnector(wagmiConfig);
        if (!connector) {
          log.error("Failed to setup react wagmi connector");
          throw new Error("Failed to setup connector");
        }

        await connectWeb3AuthWithWagmi(connector, wagmiConfig);
        reconnect();
      } else if (!isConnected) {
        if (wagmiConfig.state.status === "connected") {
          await disconnectWeb3AuthFromWagmi(wagmiConfig);
        }
      }
    })();
  }, [isConnected, wagmiConfig, provider, reconnect]);

  return createElement(Fragment, null, children);
}

export function WagmiProvider({ children, ...props }: PropsWithChildren<WagmiProviderProps>) {
  const { config } = props;
  const { web3Auth, isInitialized } = useWeb3Auth();

  const wagmiConfig = useMemo(() => {
    let finalConfig: CreateConfigParameters;
    const web3authConnector = createWeb3AuthConnector(web3Auth);
    if (!isInitialized) {
      defaultWagmiConfig.connectors = [web3authConnector];
      finalConfig = defaultWagmiConfig;
    } else {
      finalConfig = {
        ssr: true,
        ...config,
        chains: undefined,
        connectors: [web3authConnector],
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
          finalConfig.transports[wagmiChain.id] = chain.wsTarget ? webSocket(chain.wsTarget) : http(chain.rpcTarget);
        });

        finalConfig.chains = [wagmiChains[0], ...wagmiChains.slice(1)];
      }
    }

    if (web3Auth?.coreOptions?.ssr) {
      finalConfig.storage = createStorage({
        storage: cookieStorage,
      });
    }

    return createWagmiConfig(finalConfig);
  }, [config, web3Auth, isInitialized]);

  return createElement(
    WagmiProviderBase,
    // typecast to WagmiProviderPropsBase to avoid type error
    // as we are omitting the config prop from WagmiProviderProps
    // and creating a new config object with the finalConfig
    {
      ...props,
      initialState: props.initialState,
      config: wagmiConfig,
      reconnectOnMount: web3Auth?.coreOptions?.ssr,
    },
    createElement(Web3AuthWagmiProvider, null, children)
  );
}
