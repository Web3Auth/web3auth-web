import { getDeviceInfo, signChallenge, type SiwwTokens, verifySignedChallenge } from "@toruslabs/base-controllers";

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
      this.initSessionManager(accounts[0]);
      const cachedTokenInfo = await this.getCachedAuthTokenInfo();
      if (cachedTokenInfo) {
        this.status = CONNECTOR_STATUS.AUTHORIZED;
        this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, authTokenInfo: cachedTokenInfo });
        return cachedTokenInfo;
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
      const tokens: SiwwTokens = await verifySignedChallenge({
        chainNamespace,
        signedMessage,
        challenge,
        connector: this.name,
        authServer,
        web3AuthClientId: this.coreOptions.clientId,
        web3AuthNetwork: this.coreOptions.web3AuthNetwork,
        sessionTimeout: this.coreOptions.sessionTime,
        deviceInfo: getDeviceInfo(),
      });

      await this.saveAuthTokenInfo(tokens);
      const tokenInfo: AuthTokenInfo = { idToken: tokens.idToken, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, authTokenInfo: tokenInfo });
      return tokenInfo;
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
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
