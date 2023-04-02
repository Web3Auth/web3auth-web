import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCMiddleware } from "@toruslabs/openlogin-jrpc";
import type { ISignClient, SignClientTypes } from "@walletconnect/types";
import { getAccountsFromNamespaces, getChainsFromNamespaces, parseAccountId, parseChainId } from "@walletconnect/utils";
import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, log, WalletLoginError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { ethErrors } from "eth-rpc-errors";

import { createChainSwitchMiddleware, createEthMiddleware } from "../../rpc/ethRpcMiddlewares";
import { AddEthereumChainParameter, IChainSwitchHandlers } from "../../rpc/interfaces";
import { createJsonRpcClient } from "../../rpc/jrpcClient";
import { getAccounts, getProviderHandlers } from "./walletConnectV2Utils";

export interface WalletConnectV2ProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

export interface WalletConnectV2ProviderState extends BaseProviderState {
  accounts: string[];
}

export class WalletConnectV2Provider extends BaseProvider<BaseProviderConfig, WalletConnectV2ProviderState, ISignClient> {
  private connector: ISignClient | null = null;

  constructor({ config, state, connector }: { config: WalletConnectV2ProviderConfig; state?: BaseProviderState; connector?: ISignClient }) {
    super({
      config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.EIP155 }, skipLookupNetwork: !!config.skipLookupNetwork },
      state: { ...(state || {}), chainId: "loading", accounts: [] },
    });
    this.connector = connector || null;
  }

  public static getProviderInstance = async (params: {
    connector: ISignClient;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
    skipLookupNetwork: boolean;
  }): Promise<WalletConnectV2Provider> => {
    const providerFactory = new WalletConnectV2Provider({ config: { chainConfig: params.chainConfig, skipLookupNetwork: params.skipLookupNetwork } });
    await providerFactory.setupProvider(params.connector);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.connector)
      throw ethErrors.provider.custom({ message: "Connector is not initialized, pass wallet connect connector in constructor", code: 4902 });
    await this.setupProvider(this.connector);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider(connector: ISignClient): Promise<void> {
    this.onConnectorStateUpdate(connector);
    await this.setupEngine(connector);
  }

  public async switchChain({ chainId }: { chainId: string }): Promise<void> {
    if (!this.connector)
      throw ethErrors.provider.custom({ message: "Connector is not initialized, pass wallet connect connector in constructor", code: 4902 });
    const currentChainConfig = this.getChainConfig(chainId);
    this.configure({ chainConfig: currentChainConfig });
    await this.setupEngine(this.connector);
  }

  async addChain(chainConfig: CustomChainConfig): Promise<void> {
    super.addChain(chainConfig);
  }

  // no need to implement this method in wallet connect v2.
  protected async lookupNetwork(_: ISignClient): Promise<string> {
    return this.config.chainConfig.chainId;
  }

  private async setupEngine(connector: ISignClient): Promise<void> {
    const { chainId } = this.config.chainConfig;
    const numChainId = parseInt(chainId, 16);
    const providerHandlers = getProviderHandlers({ connector, chainId: numChainId });
    const jrpcRes = await getAccounts(connector);

    this.update({
      accounts: jrpcRes || [],
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getChainSwitchMiddleware();
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IChainSwitchHandlers = {
      addChain: async (params: AddEthereumChainParameter): Promise<void> => {
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency } = params;
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId,
          ticker: nativeCurrency?.symbol || "ETH",
          tickerName: nativeCurrency?.name || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: blockExplorerUrls?.[0] || "",
          decimals: nativeCurrency?.decimals || 18,
        });
      },
      switchChain: async (params: { chainId: string }): Promise<void> => {
        const { chainId } = params;
        await this.switchChain({ chainId });
      },
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
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

  private checkIfChainIdAllowed(chainId) {
    if (!this.connector || !this.connectedTopic()) return false;
    const sessionData = this.connector.session.get(this.connectedTopic());
    const allChains = getChainsFromNamespaces(sessionData.namespaces);

    let chainAllowed = false;
    for (const chain of allChains) {
      const parsedId = parseChainId(chain);
      if (Number.parseInt(parsedId.reference, 10) === Number.parseInt(chainId, 10)) {
        chainAllowed = true;
        break;
      }
    }
    return chainAllowed;
  }

  private checkIfAccountAllowed(address) {
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
        this.provider.emit("accountsChanged", data);
      }

      if (event.name === "chainChanged") {
        const { chainId: connectedChainId, rpcUrl } = data;
        const connectedHexChainId = `0x${connectedChainId.toString(16)}`;

        if (!this.checkIfChainIdAllowed(connectedHexChainId)) return;
        // Check if chainId changed and trigger event
        if (connectedHexChainId && this.state.chainId !== connectedHexChainId) {
          const maybeConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, connectedHexChainId) || {};
          // Handle rpcUrl update
          this.configure({
            chainConfig: { ...maybeConfig, chainId: connectedHexChainId, rpcTarget: rpcUrl, chainNamespace: CHAIN_NAMESPACES.EIP155 },
          });
          await this.setupEngine(connector);
        }
      }
    });
  }
}
