import { getDeviceInfo, signChallenge, type SiwwTokens, verifySignedChallenge } from "@toruslabs/base-controllers";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";

import {
  BaseConnector,
  checkIfTokenIsExpired,
  citadelServerUrl,
  clearToken,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  ConnectorInitOptions,
  getSavedToken,
  IdentityTokenInfo,
  saveToken,
  WALLET_CONNECTOR_TYPE,
  WalletInitializationError,
  WalletLoginError,
} from "../../base";

export abstract class BaseEvmConnector<T> extends BaseConnector<T> {
  async init(_?: ConnectorInitOptions): Promise<void> {}

  async getIdentityToken(): Promise<IdentityTokenInfo> {
    if (!this.provider || !this.canAuthorize) throw WalletLoginError.notConnectedError();
    if (!this.coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with valid options");
    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: this.name as WALLET_CONNECTOR_TYPE });
    const accounts = await this.provider.request<never, string[]>({ method: EVM_METHOD_TYPES.GET_ACCOUNTS });
    if (accounts && accounts.length > 0) {
      const cachedTokenInfo = this.getCachedTokenInfo(accounts[0] as string);
      if (cachedTokenInfo) {
        this.status = CONNECTOR_STATUS.AUTHORIZED;
        this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, identityTokenInfo: cachedTokenInfo });
        return cachedTokenInfo;
      }

      const chainId = await this.provider.request<never, string>({ method: "eth_chainId" });
      const currentChainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
      if (!currentChainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before authentication");
      const { chainNamespace } = currentChainConfig;
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
      const hexChallenge = `0x${Buffer.from(challenge, "utf8").toString("hex")}`;

      const signedMessage = await this.provider.request<[string, string], string>({
        method: EVM_METHOD_TYPES.PERSONAL_SIGN,
        params: [hexChallenge, accounts[0]],
      });

      const tokens: SiwwTokens = await verifySignedChallenge({
        chainNamespace,
        signedMessage: signedMessage as string,
        challenge,
        connector: this.name,
        authServer,
        web3AuthClientId: this.coreOptions.clientId,
        web3AuthNetwork: this.coreOptions.web3AuthNetwork,
        sessionTimeout: this.coreOptions.sessionTime,
        deviceInfo: getDeviceInfo(),
      });

      const tokenInfo: IdentityTokenInfo = { idToken: tokens.idToken, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
      saveToken(accounts[0] as string, this.name, JSON.stringify(tokenInfo));
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, identityTokenInfo: tokenInfo });
      return tokenInfo;
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    const accounts = await this.provider.request<never, string[]>({ method: "eth_accounts" });
    if (accounts && accounts.length > 0) {
      clearToken(accounts[0], this.name);
    }
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }

  private getCachedTokenInfo(account: string): IdentityTokenInfo | null {
    const saved = getSavedToken(account, this.name);
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved) as IdentityTokenInfo;
      if (parsed.idToken && !checkIfTokenIsExpired(parsed.idToken)) return parsed;
    } catch {
      if (!checkIfTokenIsExpired(saved)) return { idToken: saved };
    }
    return null;
  }
}
