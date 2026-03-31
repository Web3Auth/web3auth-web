import type { ExternalButton } from "../../interfaces";

export interface ConnectWalletProps {
  allRegistryButtons: ExternalButton[];
  customConnectorButtons: ExternalButton[];
  connectorVisibilityMap: Record<string, boolean>;
  isExternalWalletModeOnly?: boolean;
}
