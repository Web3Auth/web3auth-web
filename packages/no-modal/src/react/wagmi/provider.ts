import { createElement, Fragment, PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { type Chain, defineChain, isAddress as isEvmAddress } from "viem";
import {
  Config,
  Connection,
  Connector,
  createConfig as createWagmiConfig,
  type CreateConfigParameters,
  CreateConnectorFn,
  fallback,
  http,
  useConfig as useWagmiConfig,
  useConnectionEffect,
  useReconnect,
  WagmiProvider as WagmiProviderBase,
  webSocket,
} from "wagmi";
import { injected } from "wagmi/connectors";

import { CHAIN_NAMESPACES, CustomChainConfig, log, WalletInitializationError, WEB3AUTH_CONNECTOR_ID } from "../../base";
import { useWeb3Auth, useWeb3AuthDisconnect } from "../hooks";
import { defaultWagmiConfig } from "./constants";
import { WagmiProviderProps } from "./interface";

export function getWeb3authConnector(config: Config) {
  return config.connectors.find((c) => c.id === WEB3AUTH_CONNECTOR_ID);
}

// Helper to create a Web3Auth connector to connect with wagmi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWeb3AuthConnectorForWagmi(provider: any): CreateConnectorFn {
  const baseConnector = injected({
    target: {
      provider: provider,
      id: WEB3AUTH_CONNECTOR_ID,
      name: "Web3Auth",
    },
  });

  return (config) => {
    const connector = baseConnector(config);
    const baseOnAccountsChanged = connector.onAccountsChanged.bind(connector);

    // we need to handle the `accountsChanged` event emitted on the cross-namespace chain switch.
    // on evm -> solana, the accountsChanged event is emitted with the solana address, which is not valid for evm.
    // that causes the `invalid account address` error in wagmi. So, here, we're filtering out the solana addresses.
    connector.onAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0 && !accounts.every((account) => typeof account === "string" && isEvmAddress(account))) {
        log.warn("onAccountsChanged::accountsChanged event received on non-EVM address");
        return;
      }
      baseOnAccountsChanged(accounts);
    };

    return connector;
  };
}

// Helper to initialize connectors for the given wallets
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupConnector(provider: any, config: Config, connector?: Connector): Connector {
  if (connector) return connector;

  // Create new connector if not already existing
  const w3aConnector = createWeb3AuthConnectorForWagmi(provider);

  const result = config._internal.connectors.setup(w3aConnector);
  config._internal.connectors.setState((current) => [...current, result]);
  return result;
}

export async function connectWeb3AuthWithWagmi(connector: Connector, config: Config) {
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

export function resetConnectorState(config: Config) {
  config._internal.connectors.setState((prev) => prev.filter((c) => c.id !== WEB3AUTH_CONNECTOR_ID));
  config.connectors.filter((c) => c.id !== WEB3AUTH_CONNECTOR_ID);
}

export async function disconnectWeb3AuthFromWagmi(config: Config) {
  const connector = getWeb3authConnector(config);
  await Promise.all([config.storage?.setItem(`${connector?.id}.disconnected`, true), config.storage?.removeItem("injected.connected")]);
  resetConnectorState(config);
  config.setState((state) => ({
    ...state,
    chainId: state.chainId,
    connections: new Map(),
    current: undefined,
    status: "disconnected",
  }));
}

function Web3AuthWagmiProvider({ children }: PropsWithChildren) {
  const { isConnected, connection, chainNamespace } = useWeb3Auth();
  const { disconnect } = useWeb3AuthDisconnect();
  const wagmiConfig = useWagmiConfig();
  const { mutate: reconnect } = useReconnect();
  const suppressWagmiDisconnect = useRef(false);
  const lastSyncedBinding = useRef<{ provider: unknown | null; connectorName: string | null }>({
    provider: null,
    connectorName: null,
  });

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
      const shouldBindToWagmi = isConnected && chainNamespace === CHAIN_NAMESPACES.EIP155 && Boolean(connection?.ethereumProvider);
      const w3aWagmiConnector = getWeb3authConnector(wagmiConfig);
      if (shouldBindToWagmi) {
        const hasSameBinding =
          lastSyncedBinding.current.provider === connection.ethereumProvider && lastSyncedBinding.current.connectorName === connection.connectorName;

        if (hasSameBinding && wagmiConfig.state.status === "connected") {
          return;
        }
        if (!hasSameBinding && w3aWagmiConnector) {
          if (wagmiConfig.state.status === "connected") {
            suppressWagmiDisconnect.current = true;
            await disconnectWeb3AuthFromWagmi(wagmiConfig);
          } else {
            resetConnectorState(wagmiConfig);
          }
        }

        const connector = setupConnector(connection.ethereumProvider, wagmiConfig, w3aWagmiConnector);
        if (!connector) {
          throw new Error("Failed to setup connector");
        }

        await connectWeb3AuthWithWagmi(connector, wagmiConfig);
        lastSyncedBinding.current = {
          provider: connection.ethereumProvider,
          connectorName: connection.connectorName,
        };
        reconnect();
      } else {
        lastSyncedBinding.current = { provider: null, connectorName: null };
        if (wagmiConfig.state.status === "connected") {
          suppressWagmiDisconnect.current = true;
          await disconnectWeb3AuthFromWagmi(wagmiConfig);
        } else if (w3aWagmiConnector) {
          resetConnectorState(wagmiConfig);
        }
      }
    })();
  }, [chainNamespace, connection, isConnected, reconnect, wagmiConfig]);

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
