import { CHAIN_NAMESPACES, type CustomChainConfig, log, WalletInitializationError } from "@web3auth/no-modal";
import { createElement, Fragment, PropsWithChildren, useEffect, useMemo } from "react";
import { type Chain, defineChain, http, webSocket } from "viem";
import {
  Config,
  Connection,
  Connector,
  createConfig as createWagmiConfig,
  type CreateConfigParameters,
  CreateConnectorFn,
  fallback,
  useAccountEffect,
  useConfig as useWagmiConfig,
  useReconnect,
  WagmiProvider as WagmiProviderBase,
} from "wagmi";
import { injected } from "wagmi/connectors";

import { useWeb3Auth, useWeb3AuthDisconnect } from "../hooks";
import { defaultWagmiConfig } from "./constants";
import { WagmiProviderProps } from "./interface";

const WEB3AUTH_CONNECTOR_ID = "web3auth";

// Helper to initialize connectors for the given wallets
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setupConnector(provider: any, config: Config) {
  let connector: Connector | CreateConnectorFn = config.connectors.find((c) => c.id === WEB3AUTH_CONNECTOR_ID);

  if (connector) return connector;

  // Create new connector if not already existing
  connector = injected({
    target: {
      provider: provider,
      id: WEB3AUTH_CONNECTOR_ID,
      name: "Web3Auth",
    },
  });

  const result = config._internal.connectors.setup(connector);
  config._internal.connectors.setState((current) => [...current, result]);
  return result;
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
        const connector = await setupConnector(provider, wagmiConfig);
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
