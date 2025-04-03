import { EMAIL_FLOW } from "@web3auth/auth";

import { CodeInitiateRequestBodyParams, CodeVerifyRequestBodyParams, PasswordlessHandlerParams } from "../interfaces";
import { PasswordlessHandler } from "./AbstractHandler";

export default class EmailPasswordlessHandler extends PasswordlessHandler {
  mailSent: boolean;

  constructor(params: PasswordlessHandlerParams) {
    super(params);

    this.mailSent = false;

    if (this.sessionStorageAvailable) this.trackingId = window.sessionStorage.getItem("trackingId") ?? undefined;
  }

  async sendVerificationCode() {
    const { loginHint, clientId, network, web3authClientId } = this.passwordlessParams;

    const finalParams: CodeInitiateRequestBodyParams = {
      client_id: clientId,
      web3auth_client_id: web3authClientId,
      connection: this.connection,
      login_hint: loginHint,
      tracking_id: this.trackingId,
      whitelabel: this.whiteLabelParams,
      version: "",
      network,
      flow_type: EMAIL_FLOW.code,
    };

    return super.start(finalParams);
  }

  async verifyCode(code: string): Promise<{ id_token: string } | null> {
    const { clientId, loginHint, network } = this.passwordlessParams;

    const params: CodeVerifyRequestBodyParams = {
      client_id: clientId,
      login_hint: loginHint,
      code,
      connection: "email",
      tracking_id: this.trackingId as string,
      version: "",
      network,
      flow_type: EMAIL_FLOW.code,
    };

    return super.verify(params);
  }
}
