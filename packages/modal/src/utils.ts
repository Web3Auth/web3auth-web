import { SIGNER_MAP } from "@toruslabs/constants";
import { get } from "@toruslabs/http-helpers";
import type { OPENLOGIN_NETWORK_TYPE, WhiteLabelData } from "@toruslabs/openlogin-utils";
import { WEB3AUTH_NETWORK } from "@web3auth/base";

interface PROJECT_CONFIG_RESPONSE {
  whitelabel?: WhiteLabelData;
  sms_otp_enabled: boolean;
  wallet_connect_enabled: boolean;
  wallet_connect_project_id?: string;
}

export const signerHost = (web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE): string => {
  return SIGNER_MAP[web3AuthNetwork ?? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET];
};

export const fetchProjectConfig = async (clientId: string, web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE): Promise<PROJECT_CONFIG_RESPONSE> => {
  try {
    const url = new URL(`${signerHost(web3AuthNetwork)}/api/configuration`);
    url.searchParams.append("project_id", clientId);
    const res = await get<PROJECT_CONFIG_RESPONSE>(String(url));
    return res;
  } catch (e) {
    throw new Error(`Failed to fetch project config: ${(e as Error).message}`);
  }
};
