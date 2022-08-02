import { post } from "@toruslabs/http-helpers";

import { authServer } from "../constants";
import { WalletLoginError } from "../errors";
import log from "../loglevel";
import { ADAPTER_STATUS, BaseAdapter } from "./IAdapter";
import { checkIfTokenIsExpired, getSavedToken, saveToken, signChallenge } from "./utils";

export abstract class BaseSolanaAdapter<T> extends BaseAdapter<T> {
  async authenticateUser(): Promise<{ idToken: string }> {
    const { chainNamespace, chainId } = this.chainConfig;

    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const accounts = await this.provider?.request<string[]>({
      method: "getAccounts",
    });
    if (accounts && accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0], this.name);
      const isExpired = checkIfTokenIsExpired(existingToken);
      if (!isExpired) {
        return { idToken: existingToken };
      }
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

      const signedMessage = await this.provider.request<Uint8Array>({
        method: "signMessage",
        params: [Buffer.from(challenge)],
      });

      const sigData = {
        signature: {
          s: signedMessage.toString(),
          t: "sip99",
        },
        message: challenge,
        issuer: this.name,
        audience: window.location.hostname,
        timeout: 86400,
      };
      const idTokenRes = await post<{ success: boolean; token: string; error?: string }>(`${authServer}/siww/verify`, sigData);
      if (!idTokenRes.success) {
        log.error("Failed to authenticate user, ,message verification failed", idTokenRes.error);
        throw new Error("Failed to authenticate user, ,message verification failed");
      }
      saveToken(accounts[0], this.name, idTokenRes.token);

      return {
        idToken: idTokenRes.token,
      };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }
}
