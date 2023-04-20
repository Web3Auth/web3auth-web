import { decrypt, encrypt, EncryptedMessage, getPubKeyECC, getPubKeyPoint, KeyDetails, Point, ShareStore, toPrivKeyECC } from "@tkey/common-types";
import ThresholdKey from "@tkey/core";
import { TorusServiceProvider } from "@tkey/service-provider-torus";
import { ShareSerializationModule } from "@tkey/share-serialization";
import { TorusStorageLayer } from "@tkey/storage-layer-torus";
import { AGGREGATE_VERIFIER, AGGREGATE_VERIFIER_TYPE } from "@toruslabs/customauth";
import { generatePrivate } from "@toruslabs/eccrypto";
import { keccak256 } from "@toruslabs/metadata-helpers";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { BrowserStorage } from "@toruslabs/openlogin-utils";
import { Client, utils as tssUtils } from "@toruslabs/tss-client";
import { CHAIN_NAMESPACES, CustomChainConfig, log, SafeEventEmitterProvider } from "@web3auth/base";
import { EthereumSigningProvider } from "@web3auth-mpc/ethereum-provider";
import BN from "bn.js";
import EC from "elliptic";

import { DEFAULT_CHAIN_CONFIG, DELIMITERS, ERRORS, FactorKeyTypeShareDescription, USER_PATH, WEB3AUTH_NETWORK } from "./constants";
import {
  FactorKeyCloudMetadata,
  IWeb3Auth,
  LoginParams,
  SessionData,
  TkeyLocalStoreData,
  USER_PATH_TYPE,
  UserInfo,
  WEB3AUTH_NETWORK_TYPE,
  Web3AuthOptions,
  Web3AuthState,
} from "./interfaces";
import { generateTSSEndpoints } from "./utils";

export class Web3AuthMPCCoreKit implements IWeb3Auth {
  private options: Web3AuthOptions;

  private privKeyProvider: EthereumSigningProvider | null = null;

  private torusSp: TorusServiceProvider | null = null;

  private storageLayer: TorusStorageLayer | null = null;

  private tkey: ThresholdKey | null = null;

  private state: Web3AuthState = {};

  private sessionManager!: OpenloginSessionManager<SessionData>;

  private currentStorage!: BrowserStorage;

  private _storageBaseKey = "corekit_store";

  constructor(options: Web3AuthOptions) {
    if (!options.chainConfig) options.chainConfig = DEFAULT_CHAIN_CONFIG;
    if (typeof options.manualSync !== "boolean") options.manualSync = false;
    if (!options.web3AuthNetwork) options.web3AuthNetwork = WEB3AUTH_NETWORK.MAINNET;
    if (!options.tssImportUrl) {
      if (options.web3AuthNetwork === WEB3AUTH_NETWORK.MAINNET) options.tssImportUrl = `https://sapphire-1.auth.network/tss/v1/clientWasm`;
      else options.tssImportUrl = `https://sapphire-dev-2-1.authnetwork.dev/tss/v1/clientWasm`;
    }
    if (!options.storageKey) options.storageKey = "local";
    if (!options.sessionTime) options.sessionTime = 86400;
    if (options.chainConfig.chainNamespace !== CHAIN_NAMESPACES.EIP155) {
      throw new Error("You must specify a eip155 chain config.");
    }

    this.options = options;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.privKeyProvider?.provider ? this.privKeyProvider.provider : null;
  }

  private get networkUrl(): string {
    if (this.options.web3AuthNetwork === WEB3AUTH_NETWORK.TESTNET) return "https://sapphire-dev-2-1.authnetwork.dev";
    return "https://sapphire-1.auth.network";
  }

  private get metadataUrl(): string {
    return `${this.networkUrl}/metadata`;
  }

  private get verifier(): string {
    return this.state?.userInfo?.verifier ? this.state.userInfo.verifier : "";
  }

  private get verifierId(): string {
    return this.state?.userInfo?.verifierId ? this.state.userInfo.verifierId : "";
  }

  private get signatures(): string[] {
    return this.state?.signatures ? this.state.signatures : [];
  }

  public async init(): Promise<void> {
    this.currentStorage = BrowserStorage.getInstance(this._storageBaseKey, this.options.storageKey);
    const sessionId = this.currentStorage.get<string>("sessionId");
    this.sessionManager = new OpenloginSessionManager({
      sessionTime: this.options.sessionTime,
      sessionId,
    });

    this.torusSp = new TorusServiceProvider({
      useTSS: true,
      customAuthArgs: {
        baseUrl: this.options.baseUrl ? this.options.baseUrl : `${window.location.origin}/serviceworker`,
      },
    });

    this.storageLayer = new TorusStorageLayer({
      hostUrl: this.metadataUrl,
      enableLogging: true,
    });

    const shareSerializationModule = new ShareSerializationModule();

    this.tkey = new ThresholdKey({
      enableLogging: true,
      serviceProvider: this.torusSp,
      storageLayer: this.storageLayer,
      manualSync: this.options.manualSync,
      modules: {
        shareSerializationModule,
      },
    });

    await (this.tkey.serviceProvider as TorusServiceProvider).init({});

    if (this.sessionManager.sessionKey) {
      await this.rehydrateSession();
      if (this.state.factorKey) await this.setupProvider();
    }
  }

  public async connect(params: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.tkey) {
      throw new Error("tkey not initialized, call init first");
    }

    try {
      let path: USER_PATH_TYPE | null = null;

      // oAuth login.
      if (params.subVerifierDetails) {
        // single verifier login.
        const loginResponse = await (this.tkey?.serviceProvider as TorusServiceProvider).triggerLogin(params.subVerifierDetails);
        this.updateState({
          oAuthKey: loginResponse.privateKey,
          userInfo: loginResponse.userInfo,
          signatures: loginResponse.signatures.filter((i) => Boolean(i)),
        });
      } else if (params.subVerifierDetailsArray) {
        if (params.aggregateVerifierType === AGGREGATE_VERIFIER.SINGLE_VERIFIER_ID && params.subVerifierDetailsArray.length !== 1) {
          throw new Error("Single id verifier must have exactly one sub verifier");
        }
        const loginResponse = await (this.tkey?.serviceProvider as TorusServiceProvider).triggerAggregateLogin({
          aggregateVerifierType: params.aggregateVerifierType as AGGREGATE_VERIFIER_TYPE,
          verifierIdentifier: params.aggregateVerifierIdentifier as string,
          subVerifierDetailsArray: params.subVerifierDetailsArray,
        });
        this.updateState({
          oAuthKey: loginResponse.privateKey,
          userInfo: loginResponse.userInfo[0],
          signatures: loginResponse.signatures.filter((i) => Boolean(i)),
        });
      }

      let factorKey: BN | null = null;

      const existingUser = await this.isMetadataPresent(this.state.oAuthKey as string);

      if (!existingUser) {
        // save the device share.
        factorKey = new BN(generatePrivate());
        const deviceTSSShare = new BN(generatePrivate());
        const deviceTSSIndex = 2;
        const factorPub = getPubKeyPoint(factorKey);
        await this.tkey.initialize({ useTSS: true, factorPub, deviceTSSShare, deviceTSSIndex });
        path = USER_PATH.NEW;
      } else {
        await this.tkey.initialize({ neverInitializeNewKey: true });
        const metadata = this.tkey.getMetadata();
        const tkeyPubX = metadata.pubKey.x.toString(16, 64);
        const tKeyLocalStoreString = this.currentStorage.get<string>(tkeyPubX);
        const tKeyLocalStore = JSON.parse(tKeyLocalStoreString || "{}") as TkeyLocalStoreData;

        if (tKeyLocalStore.factorKey) {
          factorKey = new BN(tKeyLocalStore.factorKey, "hex");
          const deviceShare = await this.checkIfFactorKeyValid(factorKey);
          await this.tkey.inputShareStoreSafe(deviceShare, true);
          path = USER_PATH.EXISTING;
        } else {
          throw new Error(ERRORS.TKEY_SHARES_REQUIRED);
        }
      }

      await this.tkey.reconstructKey();
      await this.finalizeTkey(path, factorKey);

      return this.provider;
    } catch (err: unknown) {
      log.error("login error", err);
      throw new Error((err as Error).message);
    }
  }

  public async exportBackupShare(): Promise<string> {
    if (!this.tkey) {
      throw new Error("Tkey not initialized, call init first.");
    }
    if (!this.state.factorKey) {
      throw new Error("local factor not available.");
    }
    const backupFactorKey = new BN(generatePrivate());
    const backupFactorPub = getPubKeyPoint(backupFactorKey);

    await this.copyFactorPub(2, backupFactorPub);
    const share = await this.getShare();
    await this.addShareDescriptionSeedPhrase(share, backupFactorKey);
    const mnemonic = (await (this.tkey.modules[FactorKeyTypeShareDescription.SeedPhrase] as ShareSerializationModule).serialize(
      backupFactorKey,
      "mnemonic"
    )) as string;
    if (!this.options.manualSync) await this.tkey.syncLocalMetadataTransitions();
    return mnemonic;
  }

  public async inputBackupShare(shareMnemonic: string) {
    if (!this.tkey) {
      throw new Error("tkey not initialized, call init first");
    }

    const factorKey = await (this.tkey.modules[FactorKeyTypeShareDescription.SeedPhrase] as ShareSerializationModule).deserialize(
      shareMnemonic,
      "mnemonic"
    );
    if (!factorKey) {
      throw new Error(ERRORS.INVALID_BACKUP_SHARE);
    }

    const deviceShare = await this.checkIfFactorKeyValid(factorKey);
    await this.tkey?.inputShareStoreSafe(deviceShare, true);
    await this.tkey?.reconstructKey();

    await this.finalizeTkey(USER_PATH.RECOVER, factorKey);
  }

  public async addSecurityQuestionShare(question: string, password: string) {
    if (!this.tkey) {
      throw new Error("Tkey not initialized, call init first.");
    }
    if (!this.state.factorKey) {
      throw new Error("local factor not available.");
    }
    if (!question || !password) {
      throw new Error("question and password are required");
    }
    if (password.length < 10) {
      throw new Error("password must be at least 10 characters long");
    }
    try {
      const backupFactorKey = new BN(generatePrivate());
      const backupFactorPub = getPubKeyPoint(backupFactorKey);
      await this.copyFactorPub(2, backupFactorPub);
      const share = await this.getShare();
      await this.addSecurityShareDescription(share, backupFactorKey);
      const passwordBN = new BN(Buffer.from(password, "utf8"));
      const encryptedFactorKey = await encrypt(getPubKeyECC(passwordBN), Buffer.from(backupFactorKey.toString("hex"), "hex"));
      const params = {
        module: FactorKeyTypeShareDescription.SecurityQuestions,
        associatedFactor: encryptedFactorKey,
        dateAdded: Date.now(),
      };
      await this.tkey?.addShareDescription(question, JSON.stringify(params), true);

      if (!this.options.manualSync) await this.tkey.syncLocalMetadataTransitions();
    } catch (error) {
      log.error("error creating password share", error);
      throw error;
    }
  }

  public async recoverSecurityQuestionShare(question: string, password: string) {
    if (!this.tkey) {
      throw new Error("tkey not initialized, call init first");
    }
    if (!question || !password) {
      throw new Error("question and password are required");
    }
    if (password.length < 10) {
      throw new Error("password must be at least 10 characters long");
    }
    let share: EncryptedMessage | null = null;

    const tKeyShareDescriptions = this.tkey.getMetadata().getShareDescription();
    for (const [key, value] of Object.entries(tKeyShareDescriptions)) {
      if (key === question) {
        share = value[0] ? JSON.parse(value[0]).associatedFactor : null;
      }
    }

    if (share === null) {
      throw new Error("question not found");
    }
    const passwordBN = new BN(Buffer.from(password, "utf8"));
    const factorKeyHex = await decrypt(toPrivKeyECC(passwordBN), share);
    const factorKey = new BN(Buffer.from(factorKeyHex).toString("hex"), "hex");
    if (!factorKey) {
      throw new Error(ERRORS.INVALID_BACKUP_SHARE);
    }

    const deviceShare = await this.checkIfFactorKeyValid(factorKey);
    await this.tkey?.inputShareStoreSafe(deviceShare, true);
    await this.tkey?.reconstructKey();

    await this.finalizeTkey(USER_PATH.RECOVER, factorKey);
  }

  public async changeSecurityQuestionShare(question: string, password: string): Promise<void> {
    if (!this.tkey) {
      throw new Error("tkey not initialized, call init first");
    }
    if (!question || !password) {
      throw new Error("question and password are required");
    }
    if (password.length < 10) {
      throw new Error("password must be at least 10 characters long");
    }

    // check if we have an existing question available or not.
    const tKeyShareDescriptions = this.tkey.getMetadata().getShareDescription();
    let oldShareDescription = null;
    for (const [key, value] of Object.entries(tKeyShareDescriptions)) {
      if (key === question) {
        oldShareDescription = value[0];
      }
    }
    if (!oldShareDescription) {
      throw new Error("No share present for this question");
    }

    const backupFactorKey = new BN(generatePrivate());
    const backupFactorPub = getPubKeyPoint(backupFactorKey);

    await this.copyFactorPub(2, backupFactorPub);
    const share = await this.getShare();
    await this.addSecurityShareDescription(share, backupFactorKey);
    const passwordBN = new BN(Buffer.from(password, "utf8"));
    const encryptedFactorKey = await encrypt(getPubKeyECC(passwordBN), Buffer.from(backupFactorKey.toString("hex"), "hex"));
    const params = {
      module: FactorKeyTypeShareDescription.SecurityQuestions,
      associatedFactor: encryptedFactorKey,
      dateAdded: Date.now(),
    };
    await this.tkey.updateShareDescription(question, oldShareDescription, JSON.stringify(params), true);
    if (!this.options.manualSync) await this.tkey.syncLocalMetadataTransitions();
  }

  public async deleteSecurityQuestionShare(question: string): Promise<void> {
    if (!this.tkey) {
      throw new Error("tkey not initialized, call init first");
    }
    if (!question) {
      throw new Error("question is required");
    }

    const tKeyShareDescriptions = this.tkey.getMetadata().getShareDescription();
    let oldShareDescription = null;
    for (const [key, value] of Object.entries(tKeyShareDescriptions)) {
      if (key === question) {
        oldShareDescription = value[0];
      }
    }
    if (!oldShareDescription) {
      throw new Error("no share description found for this question");
    }
    await this.tkey?.deleteShareDescription(question, oldShareDescription as string, true);

    if (!this.options.manualSync) await this.tkey.syncLocalMetadataTransitions();
  }

  public getUserInfo(): UserInfo {
    if (!this.state.factorKey || !this.state.userInfo) {
      throw new Error("user is not logged in.");
    }
    return this.state.userInfo;
  }

  public getKeyDetails(): KeyDetails {
    if (!this.tkey) {
      throw new Error("tkey not initialized.");
    }
    return this.tkey.getKeyDetails();
  }

  public async commitChanges(): Promise<void> {
    if (!this.tkey) {
      throw new Error("tkey not initialized.");
    }
    if (!this.state.factorKey) {
      throw new Error("factorKey not present.");
    }
    try {
      await this.tkey.syncLocalMetadataTransitions();
    } catch (error: unknown) {
      log.error("sync metadata error", error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    if (!this.sessionManager.sessionKey) {
      throw new Error("User is not logged in.");
    }
    await this.sessionManager.invalidateSession();
    this.currentStorage.set("sessionId", "");
    this.resetState();
  }

  private async finalizeTkey(path: USER_PATH_TYPE, factorKey: BN) {
    if (!this.tkey) {
      throw new Error("tkey not initialized.");
    }

    if (!path || !Object.values(USER_PATH).includes(path)) {
      throw new Error("Invalid path specified");
    }

    const { requiredShares } = this.tkey.getKeyDetails();
    if (requiredShares > 0) {
      throw new Error(ERRORS.TKEY_SHARES_REQUIRED);
    }

    const tssNonce: number = (this.tkey.metadata.tssNonces || {})[this.tkey.tssTag];

    const { tssShare: tssShare2, tssIndex: tssShare2Index } = await this.tkey.getTSSShare(factorKey);

    const tssPubKeyPoint = this.tkey.getTSSPub();
    const tssPubKey = Buffer.from(`${tssPubKeyPoint.x.toString(16, 64)}${tssPubKeyPoint.y.toString(16, 64)}`, "hex");
    this.updateState({ tssNonce, tssShare2, tssShare2Index, tssPubKey, factorKey });

    if (path === USER_PATH.NEW) {
      const deviceShare = await this.getShare();
      await this.addShareDescriptionDeviceShare(deviceShare, factorKey);
    }
    const metadata = this.tkey.getMetadata();
    const tkeyPubX = metadata.pubKey.x.toString(16, 64);
    this.currentStorage.set(
      tkeyPubX,
      JSON.stringify({
        factorKey: factorKey.toString("hex"),
      } as TkeyLocalStoreData)
    );
    await this.tkey.syncLocalMetadataTransitions();
    await this.setupProvider();
    await this.createSession();
  }

  private checkTkeyRequirements() {
    if (!this.tkey) {
      throw new Error("tkey not initialized, call init first!");
    }
  }

  private async rehydrateSession() {
    try {
      if (!this.tkey || !this.torusSp) {
        throw new Error("tkey not initialized, call init first!");
      }
      if (!this.sessionManager.sessionKey) return {};
      const result = await this.sessionManager.authorizeSession();
      const factorKey = new BN(result.factorKey, "hex");
      if (!factorKey) {
        throw new Error("Invalid factor key");
      }
      this.torusSp.postboxKey = new BN(result.oAuthKey, "hex");
      const deviceShare = await this.checkIfFactorKeyValid(factorKey);
      await this.tkey.initialize({ neverInitializeNewKey: true });
      await this.tkey.inputShareStoreSafe(deviceShare, true);
      await this.tkey.reconstructKey();

      this.updateState({
        factorKey: new BN(result.factorKey, "hex"),
        tssNonce: result.tssNonce,
        tssShare2: new BN(result.tssShare, "hex"),
        tssShare2Index: result.tssShareIndex,
        tssPubKey: Buffer.from(result.tssPubKey.padStart(64, "0"), "hex"),
        signatures: result.signatures,
        userInfo: result.userInfo,
      });
    } catch (err) {
      log.error("error trying to authorize session", err);
    }
  }

  private async createSession() {
    try {
      const sessionId = OpenloginSessionManager.generateRandomSessionKey();
      this.sessionManager.sessionKey = sessionId;
      const { oAuthKey, factorKey, userInfo, tssNonce, tssShare2, tssShare2Index, tssPubKey } = this.state;
      if (!oAuthKey || !factorKey || !tssShare2 || !tssPubKey || !userInfo) {
        throw new Error("User not logged in");
      }
      const payload: SessionData = {
        oAuthKey,
        factorKey: factorKey?.toString("hex"),
        tssNonce: tssNonce as number,
        tssShareIndex: tssShare2Index as number,
        tssShare: tssShare2.toString("hex"),
        tssPubKey: Buffer.from(tssPubKey).toString("hex"),
        signatures: this.signatures,
        userInfo,
      };
      await this.sessionManager.createSession(payload);
      this.currentStorage.set("sessionId", sessionId);
    } catch (err) {
      log.error("error creating session", err);
    }
  }

  private async isMetadataPresent(privateKey: string) {
    // TODO define metadata type.
    const privateKeyBN = new BN(privateKey, "hex");
    const metadata = await this.tkey?.storageLayer.getMetadata({ privKey: privateKeyBN });
    if (metadata && Object.keys(metadata).length > 0 && (metadata as any).message !== "KEY_NOT_FOUND") {
      return true;
    }
    return false;
  }

  private async checkIfFactorKeyValid(factorKey: BN): Promise<ShareStore> {
    if (factorKey === null) throw new Error("Invalid factor key");
    this.checkTkeyRequirements();
    const factorKeyMetadata = await this.tkey?.storageLayer.getMetadata<{ message: string }>({ privKey: factorKey });
    if (!factorKeyMetadata || factorKeyMetadata.message === "KEY_NOT_FOUND") {
      throw new Error("no metadata for your factor key, reset your account");
    }
    const metadataShare = JSON.parse(factorKeyMetadata.message);
    if (!metadataShare.share || !metadataShare.tssShare) throw new Error("Invalid data from metadata");
    return metadataShare.share;
  }

  // Not required right now, but could be used in the future.
  private addNewShare(newShareIndex: number, backupFactorPub: Point) {
    if (!this.tkey) throw new Error("tkey not available, call init first");
    if (!this.state.tssShare2 || !this.state.tssShare2Index) {
      throw new Error("Input share is not available");
    }
    if (newShareIndex !== 2 && newShareIndex !== 3) {
      throw new Error("tss shares can only be 2 or 3");
    }
    return this.tkey.generateNewShare(true, {
      inputTSSIndex: this.state.tssShare2Index,
      inputTSSShare: this.state.tssShare2,
      newFactorPub: backupFactorPub,
      newTSSIndex: newShareIndex,
      authSignatures: this.signatures,
    });
  }

  private async copyFactorPub(newFactorTSSIndex: number, newFactorPub: Point) {
    if (!this.tkey) {
      throw new Error("tkey does not exist, cannot copy factor pub");
    }
    if (!this.tkey.metadata.factorPubs || !Array.isArray(this.tkey.metadata.factorPubs[this.tkey.tssTag])) {
      throw new Error("factorPubs does not exist, failed in copy factor pub");
    }
    if (!this.tkey.metadata.factorEncs || typeof this.tkey.metadata.factorEncs[this.tkey.tssTag] !== "object") {
      throw new Error("factorEncs does not exist, failed in copy factor pub");
    }
    if (!this.state.tssShare2Index || !this.state.tssShare2) {
      throw new Error("factor key does not exist");
    }
    if (newFactorTSSIndex !== 2 && newFactorTSSIndex !== 3) {
      throw new Error("input factor tssIndex must be 2 or 3");
    }

    const existingFactorPubs = this.tkey.metadata.factorPubs[this.tkey.tssTag].slice();
    const updatedFactorPubs = existingFactorPubs.concat([newFactorPub]);
    if (this.state.tssShare2Index !== newFactorTSSIndex) {
      throw new Error("retrieved tssIndex does not match input factor tssIndex");
    }
    const factorEncs = JSON.parse(JSON.stringify(this.tkey.metadata.factorEncs[this.tkey.tssTag]));
    const factorPubID = newFactorPub.x.toString(16, 64);
    factorEncs[factorPubID] = {
      tssIndex: this.state.tssShare2Index,
      type: "direct",
      userEnc: await encrypt(
        Buffer.concat([
          Buffer.from("04", "hex"),
          Buffer.from(newFactorPub.x.toString(16, 64), "hex"),
          Buffer.from(newFactorPub.y.toString(16, 64), "hex"),
        ]),
        Buffer.from(this.state.tssShare2.toString(16, 64), "hex")
      ),
      serverEncs: [],
    };
    this.tkey.metadata.addTSSData({
      tssTag: this.tkey.tssTag,
      factorPubs: updatedFactorPubs,
      factorEncs,
    });
  }

  private async getShare(): Promise<ShareStore> {
    try {
      const polyId = this.tkey?.metadata.getLatestPublicPolynomial().getPolynomialID();
      const shares = this.tkey?.shares[polyId as string];
      let share: ShareStore | null = null;

      for (const shareIndex in shares) {
        if (shareIndex !== "1") {
          share = shares[shareIndex];
        }
      }
      return share as ShareStore;
    } catch (err: unknown) {
      log.error("create device share error", err);
      throw new Error((err as Error).message);
    }
  }

  private async addShareDescriptionSeedPhrase(share: ShareStore, factorKey: BN) {
    const factorIndex = getPubKeyECC(factorKey).toString("hex");
    const metadataToSet: FactorKeyCloudMetadata = {
      share,
      tssShare: this.state.tssShare2 as BN,
      tssIndex: this.state.tssShare2Index as number,
    };

    // Set metadata for factor key backup
    await this.tkey?.addLocalMetadataTransitions({
      input: [{ message: JSON.stringify(metadataToSet) }],
      privKey: [factorKey],
    });
    const params = {
      module: FactorKeyTypeShareDescription.SeedPhrase,
      dateAdded: Date.now(),
      tssShareIndex: this.state.tssShare2Index as number,
    };
    await this.tkey?.addShareDescription(factorIndex, JSON.stringify(params), true);
  }

  private async addShareDescriptionDeviceShare(deviceShare: ShareStore, factorKey: BN) {
    const factorIndex = getPubKeyECC(factorKey).toString("hex");
    const metadataToSet: FactorKeyCloudMetadata = {
      share: deviceShare,
      tssShare: this.state.tssShare2 as BN,
      tssIndex: this.state.tssShare2Index as number,
    };

    // Set metadata for factor key backup
    await this.tkey?.addLocalMetadataTransitions({
      input: [{ message: JSON.stringify(metadataToSet) }],
      privKey: [factorKey],
    });
    const params = {
      module: FactorKeyTypeShareDescription.DeviceShare,
      dateAdded: Date.now(),
      device: navigator.userAgent,
      tssShareIndex: this.state.tssShare2Index as number,
    };
    await this.tkey?.addShareDescription(factorIndex, JSON.stringify(params), true);
  }

  private async addSecurityShareDescription(deviceShare: ShareStore, factorKey: BN) {
    const factorIndex = getPubKeyECC(factorKey).toString("hex");
    const metadataToSet: FactorKeyCloudMetadata = {
      share: deviceShare,
      tssShare: this.state.tssShare2 as BN,
      tssIndex: this.state.tssShare2Index as number,
    };

    // Set metadata for factor key backup
    await this.tkey?.addLocalMetadataTransitions({
      input: [{ message: JSON.stringify(metadataToSet) }],
      privKey: [factorKey],
    });
    const params = {
      module: FactorKeyTypeShareDescription.SecurityQuestions,
      dateAdded: Date.now(),
      device: navigator.userAgent,
      tssShareIndex: this.state.tssShare2Index as number,
    };
    await this.tkey?.addShareDescription(factorIndex, JSON.stringify(params), true);
  }

  private async setupProvider() {
    const signingProvider = new EthereumSigningProvider({ config: { chainConfig: this.options.chainConfig as CustomChainConfig } });
    const { tssNonce, tssShare2, tssShare2Index, tssPubKey } = this.state;

    if (!tssPubKey) {
      throw new Error("tssPubKey not available");
    }

    const vid = `${this.verifier}${DELIMITERS.Delimiter1}${this.verifierId}`;
    const sessionId = `${vid}${DELIMITERS.Delimiter2}default${DELIMITERS.Delimiter3}${tssNonce}${DELIMITERS.Delimiter4}`;

    const sign = async (msgHash: Buffer) => {
      const parties = 4;
      const clientIndex = parties - 1;
      const tss = await import("@toruslabs/tss-lib");
      // 1. setup
      // generate endpoints for servers
      const { endpoints, tssWSEndpoints, partyIndexes } = generateTSSEndpoints(
        this.options.web3AuthNetwork as WEB3AUTH_NETWORK_TYPE,
        parties,
        clientIndex
      );
      // setup mock shares, sockets and tss wasm files.
      const [sockets] = await Promise.all([tssUtils.setupSockets(tssWSEndpoints), tss.default(this.options.tssImportUrl)]);

      const randomSessionNonce = keccak256(generatePrivate().toString("hex") + Date.now());

      // session is needed for authentication to the web3auth infrastructure holding the factor 1
      const currentSession = `${sessionId}${randomSessionNonce.toString("hex")}`;

      const participatingServerDKGIndexes = [1, 2, 3];
      const dklsCoeff = tssUtils.getDKLSCoeff(true, participatingServerDKGIndexes, tssShare2Index as number);
      const denormalisedShare = dklsCoeff.mul(tssShare2 as BN).umod(this.getEc().curve.n);
      const share = Buffer.from(denormalisedShare.toString(16, 64), "hex").toString("base64");

      if (!currentSession) {
        throw new Error(`sessionAuth does not exist ${currentSession}`);
      }

      if (!this.signatures) {
        throw new Error(`Signature does not exist ${this.signatures}`);
      }

      const client = new Client(
        currentSession,
        clientIndex,
        partyIndexes,
        endpoints,
        sockets,
        share,
        tssPubKey.toString("base64"),
        true,
        this.options.tssImportUrl as string
      );
      const serverCoeffs: Record<number, string> = {};
      for (let i = 0; i < participatingServerDKGIndexes.length; i++) {
        const serverIndex = participatingServerDKGIndexes[i];
        serverCoeffs[serverIndex] = tssUtils
          .getDKLSCoeff(false, participatingServerDKGIndexes, tssShare2Index as number, serverIndex)
          .toString("hex");
      }
      client.precompute(tss, { signatures: this.signatures, server_coeffs: serverCoeffs });
      await client.ready();
      const { r, s, recoveryParam } = await client.sign(tss as any, Buffer.from(msgHash).toString("base64"), true, "", "keccak256", {
        signatures: this.signatures,
      });
      await client.cleanup(tss, { signatures: this.signatures, server_coeffs: serverCoeffs });
      return { v: recoveryParam, r: Buffer.from(r.toString("hex"), "hex"), s: Buffer.from(s.toString("hex"), "hex") };
    };

    const getPublic: () => Promise<Buffer> = async () => {
      return tssPubKey;
    };

    await signingProvider.setupProvider({ sign, getPublic });
    this.privKeyProvider = signingProvider;
  }

  private updateState(newState: Partial<Web3AuthState>): void {
    this.state = { ...this.state, ...newState };
  }

  private resetState(): void {
    this.state = {};
  }

  private getEc(): EC.ec {
    // eslint-disable-next-line new-cap
    return new EC.ec("secp256k1");
  }
}
