import { post } from "@toruslabs/http-helpers";
import { AUTH_CONNECTION, BUILD_ENV, storageAvailable } from "@web3auth/auth";

import { PASSWORDLESS_BUILD_ENV_MAP } from "../config";
import {
  CodeInitiateRequestBodyParams,
  CodeVerifyRequestBodyParams,
  IStartResponse,
  PasswordlessHandlerParams,
  WhiteLabelParams,
} from "../interfaces";

export abstract class PasswordlessHandler {
  readonly authBaseApiUrl = `${PASSWORDLESS_BUILD_ENV_MAP[BUILD_ENV.DEVELOPMENT]}/api/v3/auth`;

  passwordlessParams: PasswordlessHandlerParams;

  trackingIdentifier?: string;

  constructor(params: PasswordlessHandlerParams) {
    if (!params.authConnection) throw new Error("authConnection is required");
    if (!params.web3authClientId) throw new Error("web3authClientId is required");
    if (!params.clientId) throw new Error("clientId is required");
    if (!params.loginHint) throw new Error("loginHint is required");
    if (!params.network) throw new Error("network is required");
    this.passwordlessParams = params;
  }

  get name(): string {
    if (this.passwordlessParams.authConnection === AUTH_CONNECTION.EMAIL_PASSWORDLESS) return "Email";
    if (this.passwordlessParams.authConnection === AUTH_CONNECTION.SMS_PASSWORDLESS) return "Mobile";
    throw new Error("Invalid authConnection");
  }

  get connection(): "email" | "sms" {
    if (this.passwordlessParams.authConnection === AUTH_CONNECTION.EMAIL_PASSWORDLESS) return "email";
    if (this.passwordlessParams.authConnection === AUTH_CONNECTION.SMS_PASSWORDLESS) return "sms";
    throw new Error("Invalid authConnection");
  }

  get trackingId(): string | undefined {
    return this.trackingIdentifier;
  }

  get sessionStorageAvailable(): boolean {
    return storageAvailable("sessionStorage");
  }

  get whiteLabelParams(): WhiteLabelParams {
    const { uiConfig } = this.passwordlessParams;
    if (!uiConfig) return {};

    const { appName, appUrl, defaultLanguage, mode, logoLight, logoDark, theme } = uiConfig;
    const finalLogo = (mode === "dark" ? logoDark : logoLight) ?? "";
    return {
      mode: mode ?? "light",
      name: appName ?? "",
      url: appUrl ?? "",
      language: defaultLanguage ?? "en",
      logo: finalLogo.includes(".svg") ? "" : finalLogo,
      theme: theme ?? {},
    };
  }

  set trackingId(value: string | undefined) {
    this.trackingIdentifier = value;
  }

  protected async start(params: CodeInitiateRequestBodyParams): Promise<IStartResponse> {
    const result = await post<IStartResponse>(`${this.authBaseApiUrl}/passwordless/start`, params);
    if (result && result.success) {
      this.trackingId = result.data?.trackingId;
      if (this.sessionStorageAvailable) window.sessionStorage.setItem("trackingId", this.trackingId as string);
    }
    return result;
  }

  protected async verify(params: CodeVerifyRequestBodyParams): Promise<{ id_token: string } | null> {
    const result = await post<{ success: boolean; id_token?: string; message: string }>(`${this.authBaseApiUrl}/passwordless/verify`, params);
    if (result.success) {
      if (this.sessionStorageAvailable) window.sessionStorage.removeItem("trackingId");
      return {
        id_token: result.id_token as string,
      };
    }
    return null;
  }

  abstract sendVerificationCode(params?: { captchaToken: string }): Promise<IStartResponse>;

  abstract verifyCode(code: string): Promise<{ id_token: string } | null>;
}
