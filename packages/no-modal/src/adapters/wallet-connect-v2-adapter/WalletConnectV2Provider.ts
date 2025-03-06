import type { ISignClient, SignClientTypes } from "@walletconnect/types";
import { getAccountsFromNamespaces, parseAccountId } from "@walletconnect/utils";
import { JRPCEngine, JRPCMiddleware, providerErrors, providerFromEngine } from "@web3auth/auth";

import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, log, WalletLoginError } from "@/core/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@/core/base-provider";
import {
  AddEthereumChainParameter,
  createEthChainSwitchMiddleware,
  createEthJsonRpcClient,
  createEthMiddleware,
  IEthChainSwitchHandlers,
} from "@/core/ethereum-provider";
import { createSolanaJsonRpcClient as createSolJsonRpcClient, createSolanaMiddleware } from "@/core/solana-provider";

import { addChain, getAccounts, getEthProviderHandlers, getSolProviderHandlers, switchChain } from "./walletConnectV2Utils";

export interface WalletConnectV2ProviderConfig extends BaseProviderConfig {
  chainConfig: CustomChainConfig;
}

export interface WalletConnectV2ProviderState extends BaseProviderState {
  accounts: string[];
}

export class WalletConnectV2Provider extends BaseProvider<BaseProviderConfig, WalletConnectV2ProviderState, ISignClient> {
  private connector: ISignClient | null = null;

  private clientId: string;

  constructor({
    clientId,
    config,
    state,
    connector,
  }: {
    config: WalletConnectV2ProviderConfig;
    clientId: string;
    state?: BaseProviderState;
    connector?: ISignClient;
  }) {
    super({
      config: { chainConfig: config.chainConfig, skipLookupNetwork: !!config.skipLookupNetwork },
      state: { ...(state || {}), chainId: "loading", accounts: [] },
    });
    this.connector = connector || null;
    this.clientId = clientId;
  }

  public static getProviderInstance = async (params: {
    clientId: string;
    connector: ISignClient;
    chainConfig: CustomChainConfig;
    skipLookupNetwork: boolean;
  }): Promise<WalletConnectV2Provider> => {
    const providerFactory = new WalletConnectV2Provider({
      clientId: params.clientId,
      config: { chainConfig: params.chainConfig, skipLookupNetwork: params.skipLookupNetwork },
    });
    await providerFactory.setupProvider(params.connector);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.connector)
      throw providerErrors.custom({ message: "Connector is not initialized, pass wallet connect connector in constructor", code: 4902 });
    await this.setupProvider(this.connector);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider(connector: ISignClient): Promise<void> {
    this.onConnectorStateUpdate(connector);
    await this.setupEngine(connector);
  }

  public async switchChain({ chainId }: { chainId: string }): Promise<void> {
    if (!this.connector)
      throw providerErrors.custom({ message: "Connector is not initialized, pass wallet connect connector in constructor", code: 4902 });
    const currentChainConfig = this.getChainConfig(chainId);

    const { chainId: currentChainId } = this.config.chainConfig;
    const currentNumChainId = parseInt(currentChainId, 16);

    await switchChain({ connector: this.connector, chainId: currentNumChainId, newChainId: chainId });

    this.configure({ chainConfig: currentChainConfig });
    await this.setupEngine(this.connector);
    this.lookupNetwork(this.connector);
  }

  async addChain(chainConfig: CustomChainConfig): Promise<void> {
    const { chainId: currentChainId } = this.config.chainConfig;
    const numChainId = parseInt(currentChainId, 16);

    await addChain({
      connector: this.connector,
      chainId: numChainId,
      chainConfig: {
        chainId: chainConfig.chainId,
        chainName: chainConfig.displayName,
        nativeCurrency: {
          name: chainConfig.tickerName,
          symbol: chainConfig.ticker.toLocaleUpperCase(),
          decimals: (chainConfig.decimals || 18) as AddEthereumChainParameter["nativeCurrency"]["decimals"],
        },
        rpcUrls: [chainConfig.rpcTarget],
        blockExplorerUrls: [chainConfig.blockExplorerUrl],
        iconUrls: [chainConfig.logo],
      },
    });

    super.addChain(chainConfig);
  }

  // no need to implement this method in wallet connect v2.
  protected async lookupNetwork(_: ISignClient): Promise<string> {
    const newChainId = this.config.chainConfig.chainId;
    this.update({ chainId: newChainId });
    this.emit("chainChanged", newChainId);
    this.emit("connect", { chainId: newChainId });
    return this.config.chainConfig.chainId;
  }

  private async setupEngine(connector: ISignClient): Promise<void> {
    if (this.config.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      return this.setupEthEngine(connector);
    } else if (this.config.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      return this.setupSolEngine(connector);
    }
    throw new Error(`Unsupported chainNamespace: ${this.config.chainConfig.chainNamespace}`);
  }

  private async setupEthEngine(connector: ISignClient): Promise<void> {
    const { chainId } = this.config.chainConfig;
    const numChainId = parseInt(chainId, 16);
    const providerHandlers = getEthProviderHandlers({ connector, chainId: numChainId });
    const jrpcRes = await getAccounts(connector);

    this.update({
      accounts: jrpcRes || [],
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getEthChainSwitchMiddleware();
    const engine = new JRPCEngine();
    const { networkMiddleware } = createEthJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  private async setupSolEngine(connector: ISignClient): Promise<void> {
    const { chainId } = this.config.chainConfig;
    const providerHandlers = getSolProviderHandlers({ connector, chainId });
    const jrpcRes = await getAccounts(connector);

    this.update({
      accounts: jrpcRes || [],
    });
    const solMiddleware = createSolanaMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createSolJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(solMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  private getEthChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IEthChainSwitchHandlers = {
      addChain: async (params: AddEthereumChainParameter): Promise<void> => {
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency, iconUrls } = params;
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId,
          ticker: nativeCurrency?.symbol || "ETH",
          tickerName: nativeCurrency?.name || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorerUrl: blockExplorerUrls?.[0] || "",
          decimals: nativeCurrency?.decimals || 18,
          logo: iconUrls?.[0] || "https://images.toruswallet.io/eth.svg",
        });
      },
      switchChain: async (params: { chainId: string }): Promise<void> => {
        const { chainId } = params;
        await this.switchChain({ chainId });
      },
    };
    const chainSwitchMiddleware = createEthChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }

  private connectedTopic() {
    if (!this.connector) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
    if (this.connector?.session?.length) {
      // currently we are supporting only 1 active session
      const lastKeyIndex = this.connector.session.keys.length - 1;
      return this.connector.session.get(this.connector.session.keys[lastKeyIndex])?.topic;
    }
    return undefined;
  }

  private checkIfAccountAllowed(address: string) {
    if (!this.connector || !this.connectedTopic()) return false;
    const sessionData = this.connector.session.get(this.connectedTopic());
    const allAccounts = getAccountsFromNamespaces(sessionData.namespaces);
    let accountAllowed = false;
    for (const account of allAccounts) {
      const parsedAccount = parseAccountId(account);
      if (parsedAccount.address?.toLowerCase() === address?.toLowerCase()) {
        accountAllowed = true;
        break;
      }
    }
    return accountAllowed;
  }

  private async onConnectorStateUpdate(connector: ISignClient) {
    connector.events.on("session_event", async (payload: SignClientTypes.EventArguments["session_event"]) => {
      log.debug("session_event data", payload);
      if (!this.provider) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
      const { event } = payload.params;
      const { name, data } = event || {};
      // Check if accounts changed and trigger event
      if (name === "accountsChanged" && data?.length && this.state.accounts[0] !== data[0] && this.checkIfAccountAllowed(data[0])) {
        this.update({
          accounts: data,
        });
        this.emit("accountsChanged", data as string[]);
      }

      if (event.name === "chainChanged") {
        if (!data) return;
        const connectedChainId = data as number;
        const connectedHexChainId = `0x${connectedChainId.toString(16)}`;

        // Check if chainId changed and trigger event
        if (connectedHexChainId && this.state.chainId !== connectedHexChainId) {
          const maybeConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, connectedHexChainId, this.clientId);
          // Handle rpcUrl update
          this.configure({
            chainConfig: { ...maybeConfig, chainId: connectedHexChainId, chainNamespace: CHAIN_NAMESPACES.EIP155 },
          });
          await this.setupEngine(connector);
        }
      }
    });
  }
}
