import { KeyDetails, ShareStore } from "@tkey/common-types";
import ThresholdKey from "@tkey/default";
import { SecurityQuestionsModule } from "@tkey/security-questions";
import { ServiceProviderBase } from "@tkey/service-provider-base";
import ShareSerialization, { ShareSerializationModule } from "@tkey/share-serialization";
import { ShareTransferModule } from "@tkey/share-transfer";
import { TorusStorageLayer } from "@tkey/storage-layer-torus";
import { WebStorageModule } from "@tkey/web-storage";
import CustomAuth, { AGGREGATE_VERIFIER_TYPE, TorusVerifierResponse } from "@toruslabs/customauth";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import BN from "bn.js";
import bowser from "bowser";

import {
  AllDeviceShares,
  CHROME_EXTENSION_STORAGE_MODULE_KEY,
  IWeb3Auth,
  LoginParams,
  ModuleShareDescription,
  PASSWORD_QUESTION,
  SECURITY_QUESTIONS_MODULE_KEY,
  SHARE_SERIALIZATION_MODULE_KEY,
  SHARE_TRANSFER_MODULE_KEY,
  ShareDesciptions as ParsedShareDesciptions,
  ShareSerializationRecoveryShares,
  WEB_STORAGE_MODULE_KEY,
  Web3AuthOptions,
} from "./interface";
import { capitalizeFirstLetter, checkIfTrueValue, formatDate, getBrowserIcon, getCustomDeviceInfo } from "./utils";

type PrivateKeyProvider = IBaseProvider<string>;

class Web3Auth implements IWeb3Auth {
  public customAuthInstance: CustomAuth | null = null;

  public provider: SafeEventEmitterProvider | null = null;

  public tKey: ThresholdKey | null = null;

  public userInfo: TorusVerifierResponse | null = null;

  public postboxKey: string | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private options: Web3AuthOptions;

  private currentChainNamespace: ChainNamespaceType;

  private chainConfig: CustomChainConfig | null = null;

  private singleFactorAuth = false;

  constructor(options: Web3AuthOptions) {
    this.chainConfig = {
      displayName: "",
      blockExplorer: "",
      ticker: "",
      tickerName: "",
      chainId: options.chainConfig.chainId as string,
      rpcTarget: options.chainConfig.rpcTarget as string,
      ...(options?.chainConfig || {}),
      chainNamespace: options.chainConfig.chainNamespace as ChainNamespaceType,
      decimals: 18,
    };

    this.singleFactorAuth = options.singleFactorAuth || false;
    this.currentChainNamespace = options.chainConfig.chainNamespace;
    this.options = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || "mainnet",
    };
  }

  init(): void {
    // custom auth
    this.customAuthInstance = new CustomAuth({
      enableOneKey: this.singleFactorAuth, // TODO: remarks: enable one key flow if singleFactorAuth mode
      network: this.options.web3AuthNetwork,
      baseUrl: this.options.baseUrl,
      enableLogging: this.options.enableLogging,
      uxMode: this.options.uxMode,
    });
    this.customAuthInstance.init({ skipSw: false });

    // private key provider
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA && this.chainConfig) {
      this.privKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155 && this.chainConfig) {
      this.privKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.OTHER) {
      this.privKeyProvider = new CommonPrivateKeyProvider();
    } else {
      throw WalletInitializationError.incompatibleChainNameSpace(
        `Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`
      );
    }
  }

  async connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.customAuthInstance || !this.privKeyProvider) throw new Error("Please call init first");

    // trigger login
    let privKey = "";
    let metadataNonce = "";
    let verifierDetails;
    if (loginParams.subVerifierDetails) {
      // single verifier login
      const loginResponse = await this.customAuthInstance.triggerLogin(loginParams.subVerifierDetails);
      privKey = loginResponse.privateKey;
      metadataNonce = loginResponse.metadataNonce;
      this.userInfo = loginResponse.userInfo;
      verifierDetails = {
        verifier: loginParams.subVerifierDetails.verifier,
        verifierId: loginResponse.userInfo.verifierId,
      };
    } else if (loginParams.subVerifierDetailsArray && loginParams.subVerifierDetailsArray.length > 0) {
      // aggregate verifier login
      const loginResponse = await this.customAuthInstance.triggerAggregateLogin({
        aggregateVerifierType: loginParams.aggregateVerifierType as AGGREGATE_VERIFIER_TYPE,
        verifierIdentifier: loginParams.aggregateVerifierIdentifier as string,
        subVerifierDetailsArray: loginParams.subVerifierDetailsArray,
      });
      privKey = loginResponse.privateKey;
      metadataNonce = loginResponse.metadataNonce;
      this.userInfo = loginResponse.userInfo[0];
      verifierDetails = {
        verifier: loginParams.aggregateVerifierIdentifier || "",
        verifierId: loginResponse.userInfo[0]?.verifierId,
      };
    } else {
      throw WalletLoginError.fromCode(4000, "Login params are invalid");
    }
    if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");

    // check if MFA enabled
    const { torusNodeEndpoints, torusNodePub } = await this.customAuthInstance.nodeDetailManager.getNodeDetails(verifierDetails);
    if (loginParams.serverTimeOffset) {
      this.customAuthInstance.torus.serverTimeOffset = loginParams.serverTimeOffset;
    }
    const pubDetails = await this.customAuthInstance.torus.getUserTypeAndAddress(torusNodeEndpoints, torusNodePub, verifierDetails, true);
    // eslint-disable-next-line no-console
    console.log("PUBDETAILS", pubDetails);
    // single factor auth
    if (this.singleFactorAuth) {
      if (pubDetails.upgraded) {
        throw WalletLoginError.mfaEnabled();
      }
      if (pubDetails.typeOfUser === "v1") {
        // This shouldn't happen for this sdk.
        await this.customAuthInstance.torus.getOrSetNonce(pubDetails.X, pubDetails.Y);
      }
      this.provider = await this.getWalletProvider(privKey);
      return this.provider;
    }

    // threshold key
    const postboxKey = checkIfTrueValue(metadataNonce) ? this.customAuthInstance.getPostboxKeyFrom1OutOf1(privKey, metadataNonce) : privKey;
    this.postboxKey = postboxKey;

    // TODO: if MFA enabled then TKey should exist, if MFA not enabled, TKey should not exist
    if (await this.checkIfTKeyExists(postboxKey)) {
      // eslint-disable-next-line no-console
      console.log("TK exist");
      await this.initTKey({ postboxKey });
    } else {
      // eslint-disable-next-line no-console
      console.log("TK doesn't exist");
    }

    // create provider
    // const tKeyPriKey = this.tKey?.privKey.toString();
    // if (!tKeyPriKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from threshold key");
    // this.provider = await this.getWalletProvider(tKeyPriKey);
    return this.provider;
  }

  async checkIfTKeyExists(postboxKey: string): Promise<boolean> {
    if (!postboxKey) throw new Error("postboxKey is empty");
    const postboxKeyBN = new BN(postboxKey, "hex");
    const storageLayer = new TorusStorageLayer({
      hostUrl: "https://metadata.tor.us",
      serverTimeOffset: this.customAuthInstance?.torus.serverTimeOffset,
    });
    const metadata = (await storageLayer.getMetadata({ privKey: postboxKeyBN })) as ShareStore;
    return Object.keys(metadata).length > 0;
  }

  async initTKey(params: { postboxKey: string }): Promise<void> {
    const { postboxKey } = params;
    const serviceProvider = new ServiceProviderBase({ postboxKey });
    this.tKey = new ThresholdKey({
      modules: {
        [SECURITY_QUESTIONS_MODULE_KEY]: new SecurityQuestionsModule(true),
        [WEB_STORAGE_MODULE_KEY]: new WebStorageModule(),
        [SHARE_TRANSFER_MODULE_KEY]: new ShareTransferModule(),
        [SHARE_SERIALIZATION_MODULE_KEY]: new ShareSerialization(),
      },
      serviceProvider,
      manualSync: true,
    });
    const { requiredShares } = await this.tKey.initialize({ neverInitializeNewKey: true });
    if (requiredShares > 0) await this.inputDeviceShare();
    await this.reconstructKey();
  }

  async reconstructKey() {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const { requiredShares } = this.tKey.getKeyDetails();
    if (requiredShares <= 0) {
      const key = await this.tKey.reconstructKey();
      return key.privKey.toString("hex");
    }
    return "";
  }

  async exportShare(shareIndex: string): Promise<string> {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    const shareStore = localTKey.outputShareStore(shareIndex);
    const serializedShare = await (localTKey.modules[SHARE_SERIALIZATION_MODULE_KEY] as ShareSerializationModule).serialize(
      shareStore.share.share,
      "mnemonic"
    );
    return serializedShare as string;
  }

  async deleteShare(shareIndex: string): Promise<void> {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    await localTKey.deleteShare(shareIndex);
  }

  // DEVICE SHARE
  async inputDeviceShare() {
    if (!this.tKey) throw new Error("TKey is not initialized");
    try {
      await (this.tKey.modules[WEB_STORAGE_MODULE_KEY] as WebStorageModule).inputShareFromWebStorage();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("unable to read share from device. Must be on other device"); // TODO: use loglevel
    }
  }

  async generateAndStoreNewDeviceShare(): Promise<void> {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    const newShare = await localTKey.generateNewShare();
    const customDeviceInfo = getCustomDeviceInfo();
    await (localTKey.modules[WEB_STORAGE_MODULE_KEY] as WebStorageModule).storeDeviceShare(
      newShare.newShareStores[newShare.newShareIndex.toString("hex")],
      customDeviceInfo
    );
    if (!localTKey.manualSync) await localTKey.syncLocalMetadataTransitions();
  }

  // DEVICE SHARE
  async addRecoveryShare() {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    const { newShareIndex } = await localTKey.generateNewShare();
    const shareDescription = {
      data: "recovery share",
      date: new Date(),
      module: SHARE_SERIALIZATION_MODULE_KEY,
    };
    await localTKey.addShareDescription(newShareIndex.toString("hex"), JSON.stringify(shareDescription), true);
    if (!localTKey.manualSync) await localTKey.syncLocalMetadataTransitions();
  }

  // PASSWORD SHARE
  async addPassword(password: string) {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    await (localTKey.modules[SECURITY_QUESTIONS_MODULE_KEY] as SecurityQuestionsModule).generateNewShareWithSecurityQuestions(
      password,
      PASSWORD_QUESTION
    );
    if (!localTKey.manualSync) await localTKey.syncLocalMetadataTransitions();
  }

  async changePassword(newPassword: string) {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    await (localTKey.modules[SECURITY_QUESTIONS_MODULE_KEY] as SecurityQuestionsModule).changeSecurityQuestionAndAnswer(
      newPassword,
      PASSWORD_QUESTION
    );
    if (!localTKey.manualSync) await localTKey.syncLocalMetadataTransitions();
  }

  async inputPassword(password: string) {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    await (localTKey.modules[SECURITY_QUESTIONS_MODULE_KEY] as SecurityQuestionsModule).inputShareFromSecurityQuestions(password);
    // try to reconstruct key
    await this.reconstructKey();
  }

  async inputBackupShare(shareMnemonic: string): Promise<void> {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const localTKey = this.tKey;
    const deserializedShare = await (localTKey.modules[SHARE_SERIALIZATION_MODULE_KEY] as ShareSerializationModule).deserialize(
      shareMnemonic,
      "mnemonic"
    );
    await localTKey.inputShare(deserializedShare);
    // try to reconstruct key
    await this.reconstructKey();
  }

  async commitChanges() {
    if (!this.tKey) throw new Error("TKey is not initialized");
    try {
      const localTKey = this.tKey;
      await localTKey.syncLocalMetadataTransitions();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("error while syncing metadata transitions", err);
      throw err;
    }
  }

  getKeyDetails(): KeyDetails {
    if (!this.tKey) throw new Error("TKey is not initialized");
    return this.tKey.getKeyDetails();
  }

  parseSharesInfo(): ParsedShareDesciptions {
    if (!this.tKey) throw new Error("TKey is not initialized");
    const { threshold: thresholdShares, totalShares, requiredShares, shareDescriptions } = this.tKey.getKeyDetails();

    const threshold = thresholdShares === 1 ? "1 factor" : `${thresholdShares}/${totalShares}`;
    const tKeyWriteMode = requiredShares <= 0;
    const availableShareDescriptionIndexes = Object.keys(shareDescriptions);
    const parsedShareDescriptions = availableShareDescriptionIndexes.reduce((acc: ModuleShareDescription[], x: string) => {
      const internalDescriptions = shareDescriptions[x].map((y) => ({ ...JSON.parse(y), shareIndex: x }));
      acc.push(...internalDescriptions);
      return acc;
    }, []);

    // recovery shares
    const parsedRecoveryShares = parsedShareDescriptions.filter((x: { module: string }) => x.module === SHARE_SERIALIZATION_MODULE_KEY);
    const recoveryShares = parsedRecoveryShares.reduce((acc: ShareSerializationRecoveryShares, x) => {
      acc[x.shareIndex] = {
        index: x.shareIndex,
        indexShort: x.shareIndex.slice(0, 4),
        data: x.data as string,
        dateAdded: formatDate(x.date as string),
      };
      return acc;
    }, {});

    // password share
    const passwordModules = parsedShareDescriptions.filter((x) => x.module === SECURITY_QUESTIONS_MODULE_KEY);
    const passwordAvailable = passwordModules.length > 0;

    // device shares
    const deviceShares = parsedShareDescriptions
      .filter((x) => x.module === CHROME_EXTENSION_STORAGE_MODULE_KEY || x.module === WEB_STORAGE_MODULE_KEY)
      .reduce((acc: AllDeviceShares, x: unknown) => {
        const y = x as ModuleShareDescription & {
          userAgent: string;
          dateAdded: string;
          date: string;
          customDeviceInfo?: string;
        };
        if (y.userAgent && y.shareIndex !== "1") {
          const browserInfo = bowser.parse(y.userAgent);
          const browserName = y.module === CHROME_EXTENSION_STORAGE_MODULE_KEY ? "Chrome Extension" : `${browserInfo.browser.name}`;
          let title = `${browserName}${y.module === CHROME_EXTENSION_STORAGE_MODULE_KEY ? "" : ` ${`V${browserInfo.browser.version}`}`}`;
          const customDeviceInfo = y.customDeviceInfo ? JSON.parse(y.customDeviceInfo) : null;
          let icon = getBrowserIcon(browserInfo.browser.name || "");
          if (customDeviceInfo && customDeviceInfo.browser) {
            title = customDeviceInfo.browser;
            icon = getBrowserIcon(customDeviceInfo.browser);
          }
          y.dateFormatted = formatDate(y.dateAdded || y.date);
          acc.push({
            customDeviceInfo,
            rawDateAdded: parseInt(y.dateAdded, 10),
            osDetails: `${browserInfo.os.name || ""}, ${capitalizeFirstLetter(browserInfo.platform.type || "")}`.trim(),
            icon,
            title,
            dateAdded: y.dateFormatted,
            module: y.module,
            index: y.shareIndex,
            userAgent: y.userAgent,
            indexShort: y.shareIndex.slice(0, 4),
          });
        }
        return acc;
      }, [] as AllDeviceShares);

    return { threshold, tKeyWriteMode, passwordAvailable, deviceShares, recoveryShares };
  }

  private async getWalletProvider(privKey: string): Promise<SafeEventEmitterProvider | null> {
    if (!this.privKeyProvider) throw new Error("Please call init first");

    let finalPrivKey = privKey.padStart(64, "0");
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
      finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
    }
    await this.privKeyProvider.setupProvider(finalPrivKey);
    return this.privKeyProvider.provider;
  }
}

export default Web3Auth;
