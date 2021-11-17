import type { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin";

type LoginSettings = LoginParams & Partial<BaseRedirectParams>;
export type { BaseRedirectParams, LoginSettings, OpenLoginOptions };
