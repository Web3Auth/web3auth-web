import "../css/web3auth.css";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BaseAdapterConfig, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import { UIConfig } from "./interfaces";
export default class LoginModal extends SafeEventEmitter {
    $modal: HTMLDivElement;
    private appLogo;
    private version;
    private isDark;
    private hasSocialWallet;
    private hasSocialEmailWallet;
    private showExternalWallets;
    private state;
    constructor({ appLogo, version, adapterListener, isDark }: UIConfig);
    get initialized(): boolean;
    init(): void;
    toggleModal: () => void;
    addSocialLogins: (adapter: WALLET_ADAPTER_TYPE, adapterConfig: BaseAdapterConfig, loginMethods: Record<string, LoginMethodConfig>) => void;
    addWalletLogins: (adaptersConfig: Record<string, BaseAdapterConfig>, adaptersData: Record<string, unknown>, options?: {
        showExternalWallets: boolean;
    }) => void;
    private addWalletConnect;
    private getSocialLogins;
    private getSocialLoginsEmail;
    private getExternalWallet;
    private toggleLoader;
    private toggleMessage;
    private subscribeCoreEvents;
}
