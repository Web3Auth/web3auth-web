export interface IBaseWalletProvider {
  publicKey?: { toBytes(): Uint8Array };
  signMessage?(message: string, pubKey: string, display?: "hex" | "utf8"): Promise<string>;
  signTransaction?(transaction: string): Promise<string>;
  signAllTransactions?(transactions: string[]): Promise<string[]>;
  signAndSendTransaction?(transaction: string): Promise<string>;
}
