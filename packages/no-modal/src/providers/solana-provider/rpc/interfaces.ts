import { JRPCRequest } from "@web3auth/auth";

import { TransactionOrVersionedTransaction } from "../interface";

export interface ISolanaChainSwitchHandlers {
  switchSolanaChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}

export interface ISolanaProviderHandlers {
  requestAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getPublicKey: (req: JRPCRequest<unknown>) => Promise<string>;
  getPrivateKey: (req: JRPCRequest<unknown>) => Promise<string>;
  signTransaction: (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>) => Promise<TransactionOrVersionedTransaction>;
  signAllTransactions: (req: JRPCRequest<{ message: TransactionOrVersionedTransaction[] }>) => Promise<TransactionOrVersionedTransaction[]>;
  signAndSendTransaction: (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>) => Promise<{ signature: string }>;
  getSecretKey: (req: JRPCRequest<unknown>) => Promise<string>;
  signMessage: (req: JRPCRequest<{ message: Uint8Array; display?: string }>) => Promise<Uint8Array>;
}
