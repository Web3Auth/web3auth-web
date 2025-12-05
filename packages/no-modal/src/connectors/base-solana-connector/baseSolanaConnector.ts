import { signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import {
  BaseConnector,
  checkIfTokenIsExpired,
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

export abstract class BaseSolanaConnector<T> extends BaseConnector<T> {
  async init(_?: ConnectorInitOptions): Promise<void> {}

  async getIdentityToken(): Promise<IdentityTokenInfo> {
    if (!this.provider || !this.canAuthorize) throw WalletLoginError.notConnectedError();
    if (!this.coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid options");

    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: this.name as WALLET_CONNECTOR_TYPE });

    const accounts = await this.provider.request<never, string[]>({ method: SOLANA_METHOD_TYPES.GET_ACCOUNTS });
    if (accounts && accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0] as string, this.name);
      if (existingToken) {
        const isExpired = checkIfTokenIsExpired(existingToken);
        if (!isExpired) {
          this.status = CONNECTOR_STATUS.AUTHORIZED;
          this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, identityTokenInfo: { idToken: existingToken } });
          return { idToken: existingToken };
        }
      }

      const chainId = await this.provider.request<never, string>({ method: "solana_chainId" });
      const currentChainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
      if (!currentChainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before authentication");
      const { chainNamespace } = currentChainConfig;

      const payload = {
        domain: window.location.origin,
        uri: window.location.href,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace);
      const signedMessage = await this.provider.request<{ data: string; display: string }, string>({
        method: SOLANA_METHOD_TYPES.SIGN_MESSAGE,
        params: { data: challenge, display: "utf8" },
      });
      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage,
        challenge,
        this.name,
        this.coreOptions.sessionTime,
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork
      );
      saveToken(accounts[0] as string, this.name, idToken);
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, identityTokenInfo: { idToken } });
      return { idToken };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    const accounts = await this.provider.request<never, string[]>({ method: SOLANA_METHOD_TYPES.GET_ACCOUNTS });
    if (accounts && accounts.length > 0) {
      clearToken(accounts[0], this.name);
    }
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }
}
