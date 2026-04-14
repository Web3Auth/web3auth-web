import type { ExternalButton } from "../../interfaces";

export interface LoginProps {
  installedExternalWalletConfig: ExternalButton[];
  totalExternalWallets: number;
  remainingUndisplayedWallets: number;
}
