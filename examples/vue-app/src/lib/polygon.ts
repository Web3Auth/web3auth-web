import { POSClient } from "@maticnetwork/maticjs";
import { SafeEventEmitterProvider } from "@web3auth/base";
import Web3 from "web3";

export const depositEth = async (posClient: POSClient, provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
    const accounts = await getAccounts(provider, uiConsole);
    const receiverAddress = accounts[0];
    const result = await posClient.depositEther(100, receiverAddress, {});
    const txHash = await result.getTransactionHash();
    const txReceipt = await result.getReceipt();
    uiConsole("tx", txReceipt, txHash);
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};

export const getAccounts = async (provider: SafeEventEmitterProvider, uiConsole: any): Promise<string[]> => {
  try {
    const web3 = new Web3(provider as any);
    const accounts = await web3.eth.getAccounts();
    uiConsole("accounts", accounts);
    return accounts;
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};
