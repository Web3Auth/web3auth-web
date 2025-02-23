import type { ISignClient, SignClientTypes } from "@walletconnect/types";
import { getAccountsFromNamespaces, parseAccountId } from "@walletconnect/utils";
import { JRPCEngine, JRPCMiddleware, providerErrors, providerFromEngine } from "@web3auth/auth";

import { CHAIN_NAMESPACES, CustomChainConfig, log, WalletLoginError } from "@/core/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@/core/base-provider";
import { createEthChainSwitchMiddleware, createEthJsonRpcClient, createEthMiddleware, IEthChainSwitchHandlers } from "@/core/ethereum-provider";
import { createSolanaJsonRpcClient as createSolJsonRpcClient, createSolanaMiddleware } from "@/core/solana-provider";

import { getAccounts, getEthProviderHandlers, getSolProviderHandlers, switchChain } from "./walletConnectV2Utils";

export interface WalletConnectV2ProviderConfig extends BaseProviderConfig {}

export interface WalletConnectV2ProviderState extends BaseProviderState {
  accounts: string[];
}

export class WalletConnectV2Provider extends BaseProvider<BaseProviderConfig, WalletConnectV2ProviderState, ISignClient> {
  private connector: ISignClient | null = null;

  constructor({ config, state, connector }: { config: WalletConnectV2ProviderConfig; state?: BaseProviderState; connector?: ISignClient }) {
    super({
      config: { chain: config.chain, chains: config.chains, skipLookupNetwork: !!config.skipLookupNetwork },
      state: { ...(state || {}), chainId: "loading", accounts: [] },
    });
    this.connector = connector || null;
  }

  public static getProviderInstance = async (params: {
    connector: ISignClient;
    skipLookupNetwork: boolean;
    chain: CustomChainConfig;
    chains: CustomChainConfig[];
  }): Promise<WalletConnectV2Provider> => {
    const providerFactory = new WalletConnectV2Provider({
      config: { chain: params.chain, chains: params.chains, skipLookupNetwork: params.skipLookupNetwork },
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
    await this.setupEngine(connector, this.config.chain.chainId);
  }

  public async switchChain({ chainId }: { chainId: string }): Promise<void> {
    if (!this.connector)
      throw providerErrors.custom({ message: "Connector is not initialized, pass wallet connect connector in constructor", code: 4902 });
    const currentChainConfig = this.getChain(chainId);

    const { chainId: currentChainId } = currentChainConfig;
    const currentNumChainId = parseInt(currentChainId, 16);

    await switchChain({ connector: this.connector, chainId: currentNumChainId, newChainId: chainId });

    await this.setupEngine(this.connector, chainId);
    this.lookupNetwork(this.connector, chainId);

    this.update({ chainId });
  }

  // no need to implement this method in wallet connect v2.
  protected async lookupNetwork(_: ISignClient, chainId: string): Promise<string> {
    return chainId;
  }

  private async setupEngine(connector: ISignClient, chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (chain.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      await this.setupEthEngine(connector, chainId);
    } else if (chain.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      await this.setupSolEngine(connector, chainId);
    } else {
      throw new Error(`Unsupported chainNamespace: ${chain.chainNamespace}`);
    }

    this.emit("chainChanged", chainId);
    this.emit("connect", { chainId });
  }

  private async setupEthEngine(connector: ISignClient, chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    const numChainId = parseInt(chainId, 16);
    const providerHandlers = getEthProviderHandlers({ connector, chainId: numChainId });
    const jrpcRes = await getAccounts(connector);

    this.update({
      accounts: jrpcRes || [],
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getEthChainSwitchMiddleware();
    const engine = new JRPCEngine();
    const { networkMiddleware } = createEthJsonRpcClient(chain);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  private async setupSolEngine(connector: ISignClient, chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    const providerHandlers = getSolProviderHandlers({ connector, chainId });
    const jrpcRes = await getAccounts(connector);

    this.update({
      accounts: jrpcRes || [],
    });
    const solMiddleware = createSolanaMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createSolJsonRpcClient(chain);
    engine.push(solMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  private getEthChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IEthChainSwitchHandlers = {
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
        const { currentChain } = this;
        if (connectedHexChainId && currentChain.chainId !== connectedHexChainId) {
          // Handle rpcUrl update
          await this.setupEngine(connector, connectedHexChainId);
        }
      }
    });
  }
}
