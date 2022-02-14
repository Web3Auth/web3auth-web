/// <reference types="react" />
import { BaseAdapterConfig, LoginMethodConfig } from "@web3auth/base";
interface ModalProps {
    isDark: boolean;
    appLogo: string;
    version: string;
    loginMethods: LoginMethodConfig;
    externalWalletConfig: Record<string, BaseAdapterConfig>;
}
export default function Modal(props: ModalProps): JSX.Element;
export {};
