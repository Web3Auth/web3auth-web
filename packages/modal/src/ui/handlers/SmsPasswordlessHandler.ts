import { CodeInitiateRequestBodyParams, CodeVerifyRequestBodyParams, PasswordlessHandlerParams } from "../interfaces";
import { PasswordlessHandler } from "./AbstractHandler";

export default class SmsPasswordlessHandler extends PasswordlessHandler {
  constructor(params: PasswordlessHandlerParams) {
    super(params);

    if (this.sessionStorageAvailable) {
      this.trackingId = window.sessionStorage.getItem("trackingId") ?? undefined;
    }
  }

  async sendVerificationCode({ captchaToken }: { captchaToken?: string }) {
    const { loginHint, network, web3authClientId } = this.passwordlessParams;

    const finalParams: CodeInitiateRequestBodyParams = {
      client_id: web3authClientId,
      web3auth_client_id: web3authClientId,
      connection: this.connection,
      login_hint: loginHint,
      tracking_id: this.trackingId,
      whitelabel: this.whiteLabelParams,
      version: this.version,
      network,
      ...(captchaToken && { captcha_token: captchaToken }),
    };
    return super.start(finalParams);
  }

  async verifyCode(code: string) {
    const { loginHint, network, web3authClientId } = this.passwordlessParams;

    const params: CodeVerifyRequestBodyParams = {
      client_id: web3authClientId,
      login_hint: loginHint,
      code,
      connection: this.connection,
      tracking_id: this.trackingId as string,
      version: this.version,
      network,
    };
    return super.verify(params);
  }
}
