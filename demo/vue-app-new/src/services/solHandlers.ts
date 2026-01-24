import { address, createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { CustomChainConfig, IProvider, log, SolanaWallet } from "@web3auth/modal";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { generateLegacyTransaction, generateSolTransferInstruction } from "../utils/solana";

/** Logger function type for demo console output */
type UIConsole = (title: string, data: unknown) => void;

export const getRpc = async (provider: IProvider): Promise<Rpc<SolanaRpcApi>> => {
  const solanaWallet = new SolanaWallet(provider);
  const connectionConfig = await solanaWallet.request<never, CustomChainConfig>({ method: "solana_provider_config" });
  return createSolanaRpc(connectionConfig.rpcTarget);
};

export const getPrivateKey = async (provider: IProvider, uiConsole: UIConsole): Promise<string | undefined> => {
  try {
    const privateKey = (await provider.request({
      method: SOLANA_METHOD_TYPES.SOLANA_PRIVATE_KEY,
      params: [],
    })) as string;
    uiConsole("privateKey", { privateKey });
    return privateKey;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
    return undefined;
  }
};

export const getBalance = async (provider: IProvider, uiConsole: UIConsole): Promise<void> => {
  try {
    const rpc = await getRpc(provider);
    const solanaWallet = new SolanaWallet(provider);
    const accounts = await solanaWallet.requestAccounts();
    const { value: balance } = await rpc.getBalance(address(accounts[0])).send();
    uiConsole("balance", { balance: balance.toString() });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};

export const signAllTransactions = async (provider: IProvider, uiConsole: UIConsole): Promise<void> => {
  try {
    const rpc = await getRpc(provider);
    const solWeb3 = new SolanaWallet(provider);
    const publicKeys = await solWeb3.requestAccounts();

    // Generate 3 transactions
    const instruction = generateSolTransferInstruction(publicKeys[0], publicKeys[0], 0.1);
    const tx1 = await generateLegacyTransaction(rpc, publicKeys[0], [instruction]);
    const tx2 = await generateLegacyTransaction(rpc, publicKeys[0], [instruction]);
    const tx3 = await generateLegacyTransaction(rpc, publicKeys[0], [instruction]);

    const signedTransactions = await solWeb3.signAllTransactions([tx1, tx2, tx3]);
    log.info("signedTransactions", signedTransactions);
    uiConsole("signed transactions", { signedTransactions });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};
