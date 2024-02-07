import { post } from "@toruslabs/http-helpers";
import { log } from "@web3auth/base";

import { FarcasterSIWEMessage, FarcasterVerifyResult, NonceCreationParams, VerifyFarcasterLoginParams } from "./interface";

export const getSiwfNonce = async (authServer: string, nonceParams: NonceCreationParams): Promise<string> => {
  const siwfGetResponse = await post<{ success: boolean; nonce?: string; error?: string }>(`${authServer}/siwf/get`, nonceParams);
  if (!siwfGetResponse.success) {
    throw new Error(siwfGetResponse.error);
  }
  return siwfGetResponse.nonce;
};

export const verifyFarcasterLogin = async (
  authServer: string,
  params: VerifyFarcasterLoginParams,
  clientId: string,
  network: string
): Promise<FarcasterVerifyResult> => {
  const body = params;
  const idTokenRes = await post<{ success: boolean; token?: string; fid?: string; userinfo: FarcasterSIWEMessage; error?: string }>(
    `${authServer}/siwf/verify`,
    body,
    {
      headers: {
        client_id: clientId,
        wallet_provider: params.issuer,
        web3auth_network: network,
      },
    }
  );
  if (!idTokenRes.success) {
    log.error("Failed to authenticate user, ,message verification failed", idTokenRes.error);
    throw new Error("Failed to authenticate user, ,message verification failed");
  }

  return {
    token: idTokenRes.token,
    fid: idTokenRes.fid,
    userinfo: idTokenRes.userinfo,
  };
};
