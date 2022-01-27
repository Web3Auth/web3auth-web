import { ISolanaWallet } from "../../../interface";

export interface PhantomWallet extends ISolanaWallet {
  isPhantom?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  _handleDisconnect(...args: unknown[]): unknown;
}
