import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  AdapterInitOptions,
  BaseAdapter,
  CHAIN_NAMESPACES,
  clearToken,
  getChainConfig,
  log,
  saveToken,
  signChallenge,
  UserAuthInfo,
  verifySignedChallenge,
  WALLET_ADAPTERS,
  WalletLoginError,
} from "@web3auth/base";

type FarcasterVerifyParams = {
  nonce: string;
  message: string;
  signature: string;
  domain: string;
  account: string;
};

export abstract class BaseEvmAdapter<T> extends BaseAdapter<T> {
  async init(_?: AdapterInitOptions): Promise<void> {
    if (!this.chainConfig) this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
  }

  async authenticateUser(args?: FarcasterVerifyParams): Promise<UserAuthInfo> {
    if (!this.provider || (this.name !== WALLET_ADAPTERS.FARCASTER && this.status !== ADAPTER_STATUS.CONNECTED))
      throw WalletLoginError.notConnectedError();
    const { chainNamespace, chainId } = this.chainConfig;
    const accounts = await this.provider.request<never, string[]>({
      method: "eth_accounts",
    });
    if ((accounts && accounts.length > 0) || this.name === WALLET_ADAPTERS.FARCASTER) {
      let account = null;
      if (this.name === WALLET_ADAPTERS.FARCASTER) {
        account = args.account;
      } else if (accounts && accounts.length > 0) {
        account = accounts[0];
      } else {
        throw new Error("invalid account");
      }

      // const existingToken = getSavedToken(account as string, this.name);
      // if (existingToken) {
      //   const isExpired = checkIfTokenIsExpired(existingToken);
      //   if (!isExpired) {
      //     return { idToken: existingToken };
      //   }
      // }

      const payload = {
        domain: this.name === WALLET_ADAPTERS.FARCASTER ? "example.com" : window.location.origin,
        uri: this.name === WALLET_ADAPTERS.FARCASTER ? "https://example.com/login" : window.location.href,
        address: account,
        chainId: parseInt(chainId, 16),
        version: "1",
        nonce: args.nonce,
        issuedAt: new Date().toISOString(),
        statement: this.name === WALLET_ADAPTERS.FARCASTER ? "Farcaster Connect" : "",
      };

      const challenge = await signChallenge(payload, chainNamespace);
      log.debug("challenge", challenge);

      let signedMessage: string = "";

      if (this.name === WALLET_ADAPTERS.FARCASTER) {
        signedMessage = args.signature;
      } else {
        signedMessage = await this.provider.request<[string, string], string>({
          method: "personal_sign",
          params: [challenge, account],
        });
      }

      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage as string,
        challenge,
        this.name,
        this.sessionTime,
        this.clientId,
        this.web3AuthNetwork
      );
      saveToken(account, this.name, idToken);
      return {
        idToken,
      };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    const accounts = await this.provider.request<never, string[]>({
      method: "eth_accounts",
    });
    if (accounts && accounts.length > 0) {
      clearToken(accounts[0], this.name);
    }
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
  }
}
