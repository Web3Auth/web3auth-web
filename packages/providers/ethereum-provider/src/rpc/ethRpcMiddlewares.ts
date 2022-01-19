import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  mergeMiddleware,
} from "@toruslabs/openlogin-jrpc";

import { createWalletMiddleware, WalletMiddlewareOptions } from "./walletMidddleware";

export type IProviderHandlers = WalletMiddlewareOptions;
export function createEthMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const {
    getAccounts,
    getPrivateKey,
    processTransaction,
    processEthSignMessage,
    processTypedMessage,
    processTypedMessageV3,
    processTypedMessageV4,
    processPersonalMessage,
    processEncryptionPublicKey,
    processDecryptMessage,
  } = providerHandlers;
  const ethMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      eth_syncing: false,
    }),
    createWalletMiddleware({
      getAccounts,
      getPrivateKey,
      processTransaction,
      processEthSignMessage,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
      processPersonalMessage,
      processEncryptionPublicKey,
      processDecryptMessage,
    }),
  ]);
  return ethMiddleware;
}

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

export interface IChainSwitchHandlers {
  addChain: (req: JRPCRequest<AddEthereumChainParameter>) => Promise<void>;
  switchChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}
export function createChainSwitchMiddleware({ addChain, switchChain }: IChainSwitchHandlers): JRPCMiddleware<unknown, unknown> {
  async function addNewChain(req: JRPCRequest<AddEthereumChainParameter>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await addChain(req);
  }
  async function updateChain(req: JRPCRequest<{ chainId: string }>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await switchChain(req);
  }

  return createScaffoldMiddleware({
    wallet_addEthereumChain: createAsyncMiddleware(addNewChain),
    wallet_switchEthereumChain: createAsyncMiddleware(updateChain),
  });
}

export interface IAccountHandlers {
  updatePrivatekey: (req: JRPCRequest<{ privateKey: string }>) => Promise<void>;
}
export function createAccountMiddleware({ updatePrivatekey }: IAccountHandlers): JRPCMiddleware<unknown, unknown> {
  async function updateAccount(req: JRPCRequest<{ privateKey: string }>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await updatePrivatekey(req);
  }

  return createScaffoldMiddleware({
    wallet_updateAccount: createAsyncMiddleware(updateAccount),
  });
}
