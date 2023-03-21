import { SafeEventEmitterProvider } from "@web3auth/base";
import Web3 from "web3";
import { IWalletProvider } from "./walletProvider";
import { convertStringToHex, Payment, xrpToDrops } from "xrpl";

const ethProvider = (provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {
  const getAccounts = async () => {
    try {
      const accounts = await provider.request<string[]>({
        method: "ripple_getAccounts"
      })

      if (accounts) {
        const accInfo = await provider.request({
            "method": "account_info",
            "params": [
                {
                    "account": accounts[0],
                    "strict": true,
                    "ledger_index": "current",
                    "queue": true
                }
            ]
        })
        uiConsole("xrpl account info", accInfo);

      } else {
        uiConsole("No accounts found, please report this issue.")
      }

     
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getBalance = async () => {
    try {
      const accounts = await provider.request<string[]>({
        method: "ripple_getAccounts"
      })

      if (accounts) {
        const accInfo = await provider.request({
            "method": "account_info",
            "params": [
                {
                    "account": accounts[0],
                    "strict": true,
                    "ledger_index": "current",
                    "queue": true
                }
            ]
        }) as Record<string, Record<string,string>>;
        uiConsole("xrpl balance", accInfo.account_data?.Balance);

      } else {
        uiConsole("No accounts found, please report this issue.")
      }

     
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signMessage = async () => {
    try {
      
        const msg = "Hello world";
        const hexMsg = convertStringToHex(msg);
        const txSign = await provider.request<string[]>({
            method: "ripple_signMessage",
            params: {
                message: hexMsg
            }
            })
        uiConsole("txRes", txSign);
       
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signAndSendTransaction = async () => {
    try {
        const accounts = await provider.request<string[]>({
            method: "ripple_getAccounts"
        })
    
        if (accounts && accounts.length > 0) {
            const tx: Payment =  {
                TransactionType: "Payment",
                Account: accounts[0] as string,
                Amount: xrpToDrops(2),
                Destination: "rJSsXjsLywTNevqLjeXV6L6AXQexnF2N5u",
            }
            const txSign = await provider.request<string[]>({
                method: "ripple_submitTransaction",
                params: {
                    transaction: tx
                }
              })
          uiConsole("txRes", txSign);
        } else {
            uiConsole("failed to fetch accounts");
        }
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };
  
  const signTransaction = async () => {
    try {
        const accounts = await provider.request<string[]>({
            method: "ripple_getAccounts"
        })
    
        if (accounts && accounts.length > 0) {
            const tx: Payment =  {
                TransactionType: "Payment",
                Account: accounts[0] as string,
                Amount: xrpToDrops(2),
                Destination: "rJSsXjsLywTNevqLjeXV6L6AXQexnF2N5u",
            }
            const txSign = await provider.request<string[]>({
                method: "ripple_signTransaction",
                params: {
                    transaction: tx
                }
              })
          uiConsole("txRes", txSign);
        } else {
            uiConsole("failed to fetch accounts");
        }
       
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };
  return { getAccounts, getBalance, signMessage, signAndSendTransaction, signTransaction };
};

export default ethProvider;
