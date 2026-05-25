import { Config, CreateConfigParameters, hydrate } from "@wagmi/core";
import { configKey, createConfig as createWagmiConfig, useConfig as useWagmiConfig, useConnectionEffect, useReconnect } from "@wagmi/vue";
import { randomId } from "@web3auth/auth";
import { CHAIN_NAMESPACES, type CustomChainConfig, log, WalletInitializationError } from "@web3auth/no-modal";
import {
  connectWeb3AuthWithWagmi,
  disconnectWeb3AuthFromWagmi,
  getWeb3authConnector,
  resetConnectorState,
  setupConnector,
} from "@web3auth/no-modal/vue/wagmi";
import { type Chain, defineChain, fallback, http, webSocket } from "viem";
import { defineComponent, h, PropType, provide, ref, shallowRef, watch } from "vue";

// import type { Config, Connection, Connector, CreateConfigParameters, CreateConnectorFn } from "wagmi";
import { useWeb3Auth, useWeb3AuthDisconnect } from "../composables";
import { defaultWagmiConfig } from "./constants";
import { WagmiProviderProps } from "./interface";

// TODO: re-use the provider from the no-modal package
const Web3AuthWagmiProvider = defineComponent({
  name: "Web3AuthWagmiProvider",
  setup() {
    const { isConnected, connection, web3Auth } = useWeb3Auth();
    const { disconnect } = useWeb3AuthDisconnect();
    const wagmiConfig = useWagmiConfig();
    const { mutate: reconnect } = useReconnect();
    const lastSyncedWeb3AuthConnection = shallowRef<unknown>(null);

    useConnectionEffect({
      onDisconnect: async () => {
        log.info("Disconnected from wagmi");
        if (isConnected.value) await disconnect();

        const connector = getWeb3authConnector(wagmiConfig);
        // reset wagmi connector state if the provider handles disconnection because of the accountsChanged event
        // from the connected provider
        if (connector) {
          resetConnectorState(wagmiConfig);
        }
      },
    });

    watch(
      [isConnected, connection, () => web3Auth.value?.currentChain?.chainNamespace],
      async () => {
        const newIsConnected = isConnected.value;
        const newConnection = connection.value;
        const newEth = newConnection?.ethereumProvider ?? null;
        const currentChainNamespace = web3Auth.value?.currentChain?.chainNamespace ?? null;
        const shouldBindToWagmi =
          newIsConnected &&
          currentChainNamespace === CHAIN_NAMESPACES.EIP155 &&
          Boolean(newConnection && newEth) &&
          newConnection?.connectorName === web3Auth.value?.primaryConnectorName;
        const w3aWagmiConnector = getWeb3authConnector(wagmiConfig);
        if (shouldBindToWagmi && newConnection && newEth) {
          // `ethereumProvider` is a stable proxy (`commonJRPCProvider`) across account switches,
          // so key wagmi resyncs off the Web3Auth connection object instead of provider identity.
          if (lastSyncedWeb3AuthConnection.value !== newConnection) {
            if (w3aWagmiConnector) {
              resetConnectorState(wagmiConfig);
            }
            lastSyncedWeb3AuthConnection.value = newConnection;
            const connector = setupConnector(newEth, wagmiConfig, w3aWagmiConnector);
            if (!connector) {
              log.error("Failed to setup vue wagmi connector");
              throw new Error("Failed to setup connector");
            }

            await connectWeb3AuthWithWagmi(connector, wagmiConfig);
            reconnect();
          }
        } else if (!newIsConnected || currentChainNamespace !== CHAIN_NAMESPACES.EIP155) {
          lastSyncedWeb3AuthConnection.value = null;
          if (w3aWagmiConnector || wagmiConfig.state.status === "connected") {
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

    const getTransport = (chain: CustomChainConfig) => {
      const { wsTarget, rpcTarget, fallbackWsTargets = [], fallbackRpcTargets = [] } = chain;
      const transports = [];
      if (wsTarget) transports.push(webSocket(wsTarget));
      if (fallbackWsTargets.length > 0) transports.push(...fallbackWsTargets.map((target) => webSocket(target)));
      if (rpcTarget) transports.push(http(rpcTarget));
      if (fallbackRpcTargets.length > 0) transports.push(...fallbackRpcTargets.map((target) => http(target)));
      return fallback(transports);
    };

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
          configParams.transports[wagmiChain.id] = getTransport(chain);
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
      (newIsInitialized: boolean, prevIsInitialized: boolean) => {
        web3Auth.value?.setAnalyticsProperties({ wagmi_enabled: true });
        if (newIsInitialized && !prevIsInitialized) {
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
    return h(
      Web3AuthWagmiInnerProvider,
      { config: this.finalConfig, key: this.configKey },
      {
        default: () => this.$slots.default?.(),
      }
    );
  },
});
