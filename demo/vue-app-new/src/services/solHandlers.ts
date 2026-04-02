import { address, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { log } from "@web3auth/modal";

/** Logger function type for demo console output */
type UIConsole = (title: string, data: unknown) => void;

export const getBalance = async (rpc: Rpc<SolanaRpcApi>, account: string, uiConsole: UIConsole): Promise<void> => {
  try {
    const { value: balance } = await rpc.getBalance(address(account)).send();
    uiConsole("balance", { balance: balance.toString() });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};
