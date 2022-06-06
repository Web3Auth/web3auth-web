import { SafeEventEmitterProvider } from "@web3auth/base";
import Web3 from "web3";
import { IWalletProvider } from "./walletProvider";

const ethProvider = (provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {
  const getAccounts = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      uiConsole("Eth accounts", accounts);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getBalance = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      const balance = await web3.eth.getBalance(accounts[0]);
      uiConsole("Eth balance", balance);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signMessage = async () => {
    try {
      const pubKey = (await provider.request({ method: "eth_accounts" })) as string[];
      const web3 = new Web3(provider as any);
      const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
      (web3.currentProvider as any)?.send(
        {
          method: "eth_sign",
          params: [pubKey[0], message],
          from: pubKey[0],
        },
        (err: Error, result: any) => {
          if (err) {
            return uiConsole(err);
          }
          uiConsole("Eth sign message => true", result);
        }
      );
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signAndSendTransaction = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      console.log("pubKey", accounts);
      const txRes = await web3.eth.sendTransaction({ from: accounts[0], to: accounts[0], value: web3.utils.toWei("0.01") });
      uiConsole("txRes", txRes);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };
  
  const signTransaction = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      console.log("pubKey", accounts);
      // only supported with social logins (openlogin adapter)
      const txRes = await web3.eth.signTransaction({ from: accounts[0], to: accounts[0], value: web3.utils.toWei("0.01") });
      uiConsole("txRes", txRes);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };
  return { getAccounts, getBalance, signMessage, signAndSendTransaction, signTransaction };
};

export default ethProvider;