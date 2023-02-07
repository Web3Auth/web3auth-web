import { KeyDetails, ModuleMap } from "@tkey/common-types";
import ThresholdKey from "@tkey/default";
import { SecurityQuestionsModule } from "@tkey/security-questions";
import { ServiceProviderBase } from "@tkey/service-provider-base";
import { TorusServiceProvider } from "@tkey/service-provider-torus";
import ShareSerialization, { ShareSerializationModule } from "@tkey/share-serialization";
import { ShareTransferModule } from "@tkey/share-transfer";
import { WebStorageModule } from "@tkey/web-storage";
import { AggregateLoginParams, CustomAuthArgs, SubVerifierDetails, TorusAggregateLoginResponse, TorusLoginResponse } from "@toruslabs/customauth";

import { SECURITY_QUESTIONS_MODULE_KEY, SHARE_SERIALIZATION_MODULE_KEY, SHARE_TRANSFER_MODULE_KEY, WEB_STORAGE_MODULE_KEY } from "./interface";

class Web3Auth {
  modules: ModuleMap;

  tKey: ThresholdKey;

  constructor({ customAuthArgs, manualSync }: { customAuthArgs: CustomAuthArgs; manualSync: boolean }) {
    this.modules = {
      [SECURITY_QUESTIONS_MODULE_KEY]: new SecurityQuestionsModule(true),
      [WEB_STORAGE_MODULE_KEY]: new WebStorageModule(),
      [SHARE_TRANSFER_MODULE_KEY]: new ShareTransferModule(),
      [SHARE_SERIALIZATION_MODULE_KEY]: new ShareSerialization(),
    };
    this.tKey = new ThresholdKey({
      modules: this.modules,
      customAuthArgs,
      manualSync,
    });
  }

  async triggerLogin(params: SubVerifierDetails): Promise<TorusLoginResponse> {
    await (this.tKey.serviceProvider as TorusServiceProvider).init({ skipSw: false });
    const loginResponse = await (this.tKey.serviceProvider as TorusServiceProvider).triggerLogin(params);
    const { requiredShares } = await this.tKey.initialize();
    if (requiredShares > 0) await this.inputDeviceShare();
    return loginResponse;
  }

  async triggerAggregateLogin(params: AggregateLoginParams): Promise<TorusAggregateLoginResponse> {
    await (this.tKey.serviceProvider as TorusServiceProvider).init({ skipSw: false });
    const loginResponse = await (this.tKey.serviceProvider as TorusServiceProvider).triggerAggregateLogin(params);
    const { requiredShares } = await this.tKey.initialize();
    if (requiredShares > 0) await this.inputDeviceShare();
    await this.reconstructKey();
    return loginResponse;
  }

  async rehydrate(params: { postboxKey: string }): Promise<void> {
    const { postboxKey } = params;
    const serviceProvider = new ServiceProviderBase({ postboxKey });
    this.tKey = new ThresholdKey({
      modules: this.modules,
      serviceProvider,
      manualSync: true,
    });
    await this.tKey.initialize();
    const { requiredShares } = await this.tKey.initialize();
    if (requiredShares > 0) await this.inputDeviceShare();
    await this.reconstructKey();
  }

  async reconstructKey() {
    const { requiredShares } = this.tKey.getKeyDetails();
    if (requiredShares <= 0) {
      const key = await this.tKey.reconstructKey();
      return key.privKey.toString("hex");
    }
    return "";
  }

  async inputDeviceShare() {
    try {
      await (this.tKey.modules[WEB_STORAGE_MODULE_KEY] as WebStorageModule).inputShareFromWebStorage();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("unable to read share from device. Must be on other device"); // TODO: use loglevel
    }
  }

  async exportShare(shareIndex: string): Promise<string> {
    const localTKey = this.tKey;
    const shareStore = localTKey.outputShareStore(shareIndex);
    const serializedShare = await (localTKey.modules[SHARE_SERIALIZATION_MODULE_KEY] as ShareSerializationModule).serialize(
      shareStore.share.share,
      "mnemonic"
    );
    return serializedShare as string;
  }

  async commitChanges() {
    try {
      const localTKey = this.tKey;
      await localTKey.syncLocalMetadataTransitions();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("error while syncing metadata transitions", err);
      throw err;
    }
  }

  async deleteShare(shareIndex: string): Promise<void> {
    const localTKey = this.tKey;
    await localTKey.deleteShare(shareIndex);
  }

  getThresholdKey(): ThresholdKey {
    return this.tKey;
  }

  getKeyDetails(): KeyDetails {
    return this.tKey.getKeyDetails();
  }
}

export default Web3Auth;
