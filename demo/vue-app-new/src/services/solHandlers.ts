import { address, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { IProvider, log } from "@web3auth/modal";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

/** Logger function type for demo console output */
type UIConsole = (title: string, data: unknown) => void;

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

export const getBalance = async (rpc: Rpc<SolanaRpcApi>, account: string, uiConsole: UIConsole): Promise<void> => {
  try {
    const { value: balance } = await rpc.getBalance(address(account)).send();
    uiConsole("balance", { balance: balance.toString() });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};
