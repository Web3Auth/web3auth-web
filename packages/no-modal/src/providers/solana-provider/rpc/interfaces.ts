import { JRPCRequest } from "@web3auth/auth";

export interface ISolanaChainSwitchHandlers {
  switchSolanaChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}

export interface ISolanaProviderHandlers {
  requestAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getPublicKey: (req: JRPCRequest<unknown>) => Promise<string>;
  getPrivateKey: (req: JRPCRequest<unknown>) => Promise<string>;
  getSecretKey: (req: JRPCRequest<unknown>) => Promise<string>;
  signMessage: (req: JRPCRequest<{ data: string; from: string; display?: string }>) => Promise<string>;
  signTransaction: (req: JRPCRequest<{ message: string }>) => Promise<string>;
  signAllTransactions: (req: JRPCRequest<{ message: string[] }>) => Promise<string[]>;
  signAndSendTransaction: (req: JRPCRequest<{ message: string }>) => Promise<string>;
}
