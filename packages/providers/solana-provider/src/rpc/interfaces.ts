import { JRPCRequest } from "@web3auth/auth";

import { TransactionOrVersionedTransaction } from "../interface";

export interface AddSolanaChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

export interface IChainSwitchHandlers {
  addNewChainConfig: (req: JRPCRequest<AddSolanaChainParameter>) => Promise<void>;
  switchSolanaChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}

export interface IProviderHandlers {
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
