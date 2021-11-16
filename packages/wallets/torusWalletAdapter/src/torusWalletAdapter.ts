import type { TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import { BASE_WALLET_EVENTS, BaseWalletAdapter, SafeEventEmitterProvider, UserInfo } from "@web3auth/base";

import type { Torus } from "./interfaces";

class TorusWalletAdapter extends BaseWalletAdapter {
  public torusInstance: Torus;

  private torusWalletOptions: TorusCtorArgs;

  constructor(torusWalletOptions: TorusCtorArgs) {
    super();
    this.torusWalletOptions = torusWalletOptions;
  }

  async init(params: TorusParams): Promise<void> {
    if (this.ready) return;
    const { default: Torus } = await import("@toruslabs/torus-embed");
    this.torusInstance = new Torus(this.torusWalletOptions);
    await this.torusInstance.init(params);
    this.ready = true;
  }

  async connect(): Promise<void> {
    if (!this.ready) throw new Error("Torus wallet adapter is not ready, please init first");
    this.connecting = true;
    await this.torusInstance.login();
    // TODO: make torus embed provider type compatatible with this
    this.provider = this.torusInstance.provider as unknown as SafeEventEmitterProvider;
    this.connected = true;
    this.connecting = false;
    this.emit(BASE_WALLET_EVENTS.CONNECTED);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new Error("Not connected with wallet");
    await this.torusInstance.logout();
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new Error("Not connected with wallet, Please login/connect first");
    const userInfo = await this.torusInstance.getUserInfo("");
    return userInfo;
  }
}

export { TorusCtorArgs, TorusParams, TorusWalletAdapter };
