import type { CustomAuthArgs, InitParams, LOGIN_TYPE, LoginDetails, TorusKeyPub } from "@toruslabs/customauth";
import { CustomChainConfig } from "@web3auth/base";

export type UserType = "v1" | "v2";

export type CustomAuthResult = {
  publicAddress: string;
  privateKey: string;
  email: string;
  name: string;
  profileImage: string;
  aggregateVerifier?: string;
  verifier: string;
  verifierId: string;
  typeOfLogin: LOGIN_TYPE;
} & TorusKeyPub;

export interface LoginSettings {
  loginProviderConfig: Record<string, LoginDetails>;
}

export interface CustomAuthAdapterOptions {
  chainConfig?: CustomChainConfig;
  adapterSettings?: CustomAuthArgs;
  initSettings?: InitParams;
  loginSettings: LoginSettings;
}
