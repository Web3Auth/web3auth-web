import { SafeEventEmitterProvider } from "@web3auth/base";
import Web3 from "web3";

export const sendEth = async (provider: SafeEventEmitterProvider, console: any) => {
    try {
      const pubKey = await provider.request({ method: "eth_accounts" })
      console.log("pubKey", pubKey)
      const web3 = new Web3(provider as any);
      const blockNumber = await provider.request({ method: "eth_getBlockByNumber", params: ["latest", false] })
      const txRes = await web3.eth.sendTransaction({ from: "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23", to: pubKey[0], value: web3.utils.toWei("0.01") })
      console("txRes", txRes)
    } catch (error) {
      console("error", error)
    }
}

export const signEthMessage =  async (provider: SafeEventEmitterProvider, console: any) =>  {
    try {
      const pubKey = await provider.request({ method: "eth_accounts" })
      const web3 = new Web3();
      web3.setProvider(provider as any)
      // hex message
      const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
      (web3.currentProvider as any)?.send(
        {
          method: "eth_sign",
          params: [pubKey[0], message],
          from: pubKey[0],
        },
        (err: Error, result: any) => {
          if (err) {
            return console(err);
          }
          console("sign message => true", result);
        }
      );
    } catch (error) {
      console("error", error)
    }
  }