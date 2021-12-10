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

export type UserType = "v1" | "v2";

export type TorusDirectAuthResult = {
  publicAddress: string;
  privateKey: string;
  metadataNonce: string;
  email: string;
  name: string;
  profileImage: string;
  aggregateVerifier?: string;
  verifier: string;
  verifierId: string;
  typeOfLogin: LOGIN_TYPE;
  ref?: string;
  registerOnly?: boolean;
  typeOfUser: UserType;
} & TorusKeyPub;

interface LoginSettings {
  loginProviderConfig: Record<
    LOGIN_TYPE,
    {
      verifier: string;
      clientId: string;
      jwtParams?: Auth0ClientOptions;
    }
  >;
}
export {
  CustomAuthArgs,
  InitParams,
  LOGIN_TYPE,
  LoginSettings,
  LoginWindowResponse,
  RedirectResult,
  TorusAggregateLoginResponse,
  TorusHybridAggregateLoginResponse,
  TorusKey,
  TorusKeyPub,
  TorusLoginResponse,
  TorusVerifierResponse,
};
