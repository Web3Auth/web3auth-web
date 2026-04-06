import { signChallenge } from "@toruslabs/base-controllers";

import {
  AuthTokenInfo,
  BaseConnector,
  CHAIN_NAMESPACES,
  citadelServerUrl,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  ConnectorInitOptions,
  getSolanaChainByChainConfig,
  WALLET_CONNECTOR_TYPE,
  WalletInitializationError,
  WalletLoginError,
  walletSignMessage,
} from "../../base";

export abstract class BaseSolanaConnector<T> extends BaseConnector<T> {
  async init(_?: ConnectorInitOptions): Promise<void> {}

  async getAuthTokenInfo(): Promise<AuthTokenInfo> {
    if (!this.solanaWallet || !this.canAuthorize) throw WalletLoginError.notConnectedError();
    if (!this.coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid options");

    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: this.name as WALLET_CONNECTOR_TYPE });

    const accounts = this.solanaWallet.accounts.map((a) => a.address);
    if (accounts.length > 0) {
      const cached = await this.getCachedOrNullAuthTokenInfo(accounts[0]);
      if (cached) return cached;

      const walletChains = new Set(this.solanaWallet.chains);
      const currentChainConfig = this.coreOptions.chains.find((c) => {
        if (c.chainNamespace !== CHAIN_NAMESPACES.SOLANA) return false;
        const id = getSolanaChainByChainConfig(c);
        return id != null && walletChains.has(id);
      });
      if (!currentChainConfig) {
        throw WalletInitializationError.invalidParams("No Solana chain in common between the connected wallet and Web3Auth chain configuration");
      }
      const { chainId, chainNamespace } = currentChainConfig;
      const authServer = citadelServerUrl(this.coreOptions.authBuildEnv);

      const payload = {
        domain: window.location.origin,
        uri: window.location.href,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace, authServer);
      const signedMessage = await walletSignMessage(this.solanaWallet, challenge, accounts[0]);
      return this.verifyAndAuthorize({ chainNamespace, signedMessage, challenge, authServer });
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async generateChallengeAndSign(authServerUrl?: string): Promise<{ challenge: string; signature: string; chainNamespace: ChainNamespaceType }> {
    const authServer = authServerUrl ?? citadelServerUrl(this.coreOptions.authBuildEnv);

    const accounts = this.solanaWallet.accounts.map((a) => a.address);
    if (!accounts || accounts?.length === 0) {
      throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    }

    const walletChains = new Set(this.solanaWallet.chains);
    const currentChainConfig = this.coreOptions.chains.find((c) => {
      if (c.chainNamespace !== CHAIN_NAMESPACES.SOLANA) return false;
      const id = getSolanaChainByChainConfig(c);
      return id != null && walletChains.has(id);
    });
    if (!currentChainConfig) {
      throw WalletInitializationError.invalidParams("No Solana chain in common between the connected wallet and Web3Auth chain configuration");
    }
    const { chainId, chainNamespace } = currentChainConfig;

    const payload = {
      domain: window.location.origin,
      uri: window.location.href,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      version: "1",
      nonce: Math.random().toString(36).slice(2),
      issuedAt: new Date().toISOString(),
    };

    const challenge = await signChallenge(payload, chainNamespace, authServer);
    const signature = await walletSignMessage(this.solanaWallet, challenge, accounts[0]);

    return { challenge, signature, chainNamespace };
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    await this.clearWalletSession();
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }
}
