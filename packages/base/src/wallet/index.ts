import { IWalletAdapter } from "../adapter/IWalletAdapter";

export interface Wallet {
  name: string;
  adapter: () => IWalletAdapter;
}
