// import { SIGNER_MAP } from "@toruslabs/constants";
// import { get } from "@toruslabs/http-helpers";
import { OPENLOGIN_NETWORK_TYPE, WhiteLabelData } from "@toruslabs/openlogin-utils";

interface PROJECT_CONFIG_RESPONSE {
  white_label?: WhiteLabelData;
  sms_otp_enabled?: boolean;
  wallet_connect_enabled?: boolean;
  wallet_connect_project_id?: string;
}

const MOCK_PROJECT_CONFIG_RESPONSE: PROJECT_CONFIG_RESPONSE = {
  sms_otp_enabled: false,
  wallet_connect_enabled: true,
  wallet_connect_project_id: "fjdklsdjdfklasdjfdla",
  white_label: {
    theme: {
      primary: "blue",
    },
  },
};

export const signerHost = (web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE): string => {
  // return SIGNER_MAP[web3AuthNetwork ?? OPENLOGIN_NETWORK.SAPPHIRE_MAINNET];
  return "http://localhost:3050";
};

export const fetchProjectConfig = async (clientId: string, web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE): Promise<PROJECT_CONFIG_RESPONSE> => {
  try {
    const url = new URL(`${signerHost(web3AuthNetwork)}/api/configuration`);
    url.searchParams.append("project_id", clientId);
    const res = MOCK_PROJECT_CONFIG_RESPONSE;
    return res;
  } catch (e) {
    throw new Error(`Failed to fetch project config: ${(e as Error).message}`);
  }
};
