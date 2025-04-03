import { CodeInitiateRequestBodyParams, CodeVerifyRequestBodyParams, PasswordlessHandlerParams } from "../interfaces";
import { PasswordlessHandler } from "./AbstractHandler";

export default class SmsPasswordlessHandler extends PasswordlessHandler {
  constructor(params: PasswordlessHandlerParams) {
    super(params);

    if (this.sessionStorageAvailable) {
      this.trackingId = window.sessionStorage.getItem("trackingId") ?? undefined;
    }
  }

  async sendVerificationCode(params?: { captchaToken: string }) {
    const { clientId, loginHint, network, web3authClientId } = this.passwordlessParams;

    const captchaToken = params?.captchaToken ?? "";

    if (!captchaToken) {
      throw new Error("Captcha token is required");
    }

    const finalParams: CodeInitiateRequestBodyParams = {
      client_id: clientId,
      web3auth_client_id: web3authClientId,
      connection: this.connection,
      login_hint: loginHint,
      tracking_id: this.trackingId,
      whitelabel: this.whiteLabelParams,
      version: "",
      network,
      captcha_token: captchaToken,
    };
    return super.start(finalParams);
  }

  async verifyCode(code: string) {
    const { clientId, loginHint, network } = this.passwordlessParams;

    const params: CodeVerifyRequestBodyParams = {
      client_id: clientId,
      login_hint: loginHint,
      code,
      connection: this.connection,
      tracking_id: this.trackingId as string,
      version: "",
      network,
    };
    return super.verify(params);
  }
}
