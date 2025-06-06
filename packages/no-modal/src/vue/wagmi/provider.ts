import { type Config, type Connection, type Connector, type CreateConnectorFn, hydrate } from "@wagmi/core";
import {
  configKey,
  createConfig as createWagmiConfig,
  type CreateConfigParameters,
  useAccountEffect,
  useConfig as useWagmiConfig,
  useReconnect,
} from "@wagmi/vue";
import { injected } from "@wagmi/vue/connectors";
import { randomId } from "@web3auth/auth";
import { type Chain, defineChain, http, webSocket } from "viem";
import { defineComponent, h, PropType, provide, ref, shallowRef, watch } from "vue";

import { CHAIN_NAMESPACES, WalletInitializationError } from "../../base";
import { log } from "../../base/loglevel";
// import type { Config, Connection, Connector, CreateConfigParameters, CreateConnectorFn } from "wagmi";
import { useWeb3Auth, useWeb3AuthDisconnect } from "../composables";
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

const Web3AuthWagmiProvider = defineComponent({
  name: "Web3AuthWagmiProvider",
  setup() {
    const { isConnected, provider } = useWeb3Auth();
    const { disconnect } = useWeb3AuthDisconnect();
    const wagmiConfig = useWagmiConfig();
    const { reconnect } = useReconnect();

    useAccountEffect({
      onDisconnect: async () => {
        log.info("Disconnected from wagmi");
        if (isConnected.value) await disconnect();
      },
    });

    watch(
      isConnected,
      async (newIsConnected) => {
        if (newIsConnected && provider.value) {
          const connector = await setupConnector(provider.value, wagmiConfig);
          if (!connector) {
            throw new Error("Failed to setup connector");
          }

          await connectWeb3AuthWithWagmi(connector, wagmiConfig);
          reconnect();
        } else if (!newIsConnected) {
          if (wagmiConfig.state.status === "connected") {
            await disconnectWeb3AuthFromWagmi(wagmiConfig);
          }
        }
      },
      { immediate: true }
    );
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});

const Web3AuthWagmiInnerProvider = defineComponent({
  name: "Web3AuthWagmiInnerProvider",
  props: { config: { type: Object as PropType<Config>, required: false } },
  setup(props) {
    const { config } = props;
    provide(configKey, config);
  },
  render() {
    return h(Web3AuthWagmiProvider, {}, this.$slots.default ?? "");
  },
});

export const WagmiProvider = defineComponent({
  name: "WagmiProvider",
  props: { config: { type: Object as PropType<WagmiProviderProps>, required: false } },
  setup(props) {
    const { config } = props;
    const { web3Auth, isInitialized } = useWeb3Auth();
    const finalConfig = shallowRef<Config>(defaultWagmiConfig);
    const configKey = ref<string>(randomId());

    const defineWagmiConfig = () => {
      const configParams: CreateConfigParameters = {
        ssr: true,
        ...config,
        chains: undefined,
        connectors: [],
        transports: {},
        multiInjectedProviderDiscovery: false,
        client: undefined,
      };

      const wagmiChains: Chain[] = [];
      if (isInitialized.value && web3Auth?.value?.coreOptions?.chains) {
        const defaultChainId = web3Auth.value.currentChain?.chainId;
        const chains = web3Auth.value.coreOptions.chains.filter((chain) => chain.chainNamespace === CHAIN_NAMESPACES.EIP155);
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
          configParams.transports[wagmiChain.id] = chain.wsTarget ? webSocket(chain.wsTarget) : http(chain.rpcTarget);
        });

        configParams.chains = [wagmiChains[0], ...wagmiChains.slice(1)];
      }

      return createWagmiConfig(configParams);
    };

    const hydrateWagmiConfig = () => {
      if (finalConfig.value) {
        hydrate(finalConfig.value, { reconnectOnMount: false, ...props.config });
      }
    };

    watch(
      isInitialized,
      (newIsInitialized) => {
        web3Auth.value?.setAnalyticsProperties({ wagmi_enabled: true });
        if (newIsInitialized && !finalConfig.value) {
          finalConfig.value = defineWagmiConfig();
          hydrateWagmiConfig();
          configKey.value = randomId();
        }
      },
      { immediate: true }
    );

    if (!isInitialized.value) {
      hydrateWagmiConfig();
    }

    return { finalConfig, configKey };
  },
  render() {
    if (!this.finalConfig) return null;
    return h(
      Web3AuthWagmiInnerProvider,
      // This key is used to remount the provider when the config changes.
      { config: this.finalConfig, key: this.configKey },
      {
        default: () => this.$slots.default?.(),
      }
    );
  },
});
