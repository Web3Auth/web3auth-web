import { signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";

import {
  BaseConnector,
  CHAIN_NAMESPACES,
  checkIfTokenIsExpired,
  clearToken,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  ConnectorInitOptions,
  getSavedToken,
  getSolanaChainByChainConfig,
  IdentityTokenInfo,
  saveToken,
  WALLET_CONNECTOR_TYPE,
  WalletInitializationError,
  WalletLoginError,
  walletSignMessage,
} from "../../base";

export abstract class BaseSolanaConnector<T> extends BaseConnector<T> {
  async init(_?: ConnectorInitOptions): Promise<void> {}

  async getIdentityToken(): Promise<IdentityTokenInfo> {
    if (!this.solanaWallet || !this.canAuthorize) throw WalletLoginError.notConnectedError();
    if (!this.coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid options");

    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: this.name as WALLET_CONNECTOR_TYPE });

    const accounts = this.solanaWallet.accounts.map((a) => a.address);
    if (accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0], this.name);
      if (existingToken) {
        const isExpired = checkIfTokenIsExpired(existingToken);
        if (!isExpired) {
          this.status = CONNECTOR_STATUS.AUTHORIZED;
          this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, identityTokenInfo: { idToken: existingToken } });
          return { idToken: existingToken };
        }
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

      const challenge = await signChallenge(payload, chainNamespace);
      const signedMessage = await walletSignMessage(this.solanaWallet, challenge, accounts[0]);
      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage,
        challenge,
        this.name,
        this.coreOptions.sessionTime,
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork
      );
      saveToken(accounts[0], this.name, idToken);
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, identityTokenInfo: { idToken } });
      return { idToken };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    const accounts = this.solanaWallet?.accounts.map((a) => a.address) ?? [];
    if (accounts.length > 0) {
      clearToken(accounts[0], this.name);
    }
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }
}
