import type {
  Auth0ClientOptions,
  CustomAuthArgs,
  InitParams,
  LOGIN_TYPE,
  LoginWindowResponse,
  RedirectResult,
  TorusAggregateLoginResponse,
  TorusHybridAggregateLoginResponse,
  TorusKey,
  TorusKeyPub,
  TorusLoginResponse,
  TorusVerifierResponse,
} from "@toruslabs/customauth";
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
  loginProviderConfig: Record<
    string,
    {
      verifier: string;
      clientId: string;
      jwtParams?: Auth0ClientOptions;
    }
  >;
}

export interface CustomAuthAdapterOptions {
  chainConfig?: CustomChainConfig;
  adapterSettings?: CustomAuthArgs;
  initSettings?: InitParams;
  loginSettings: LoginSettings;
}

export {
  CustomAuthArgs,
  InitParams,
  LOGIN_TYPE,
  LoginWindowResponse,
  RedirectResult,
  TorusAggregateLoginResponse,
  TorusHybridAggregateLoginResponse,
  TorusKey,
  TorusKeyPub,
  TorusLoginResponse,
  TorusVerifierResponse,
};
