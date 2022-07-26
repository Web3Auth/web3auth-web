//@ts-ignore
import StarkExAPI from "@starkware-industries/starkex-js/dist/browser";
//@ts-ignore
import starkwareCrypto from "@starkware-industries/starkware-crypto-utils";
import type { SafeEventEmitterProvider } from "@web3auth/base";
import { IWalletProvider } from "./walletProvider";

const starkexProvider = (provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {

  const starkExAPI = new StarkExAPI({
    endpoint: "https://gw.playground-v2.starkex.co",
    });

  const getStarkAccount = async (): Promise<any> => {
    try {
      const privateKey = await provider.request({ method: "private_key" });
      const keyPair = starkwareCrypto.ec.keyFromPrivate(privateKey, "hex");
      const account = starkwareCrypto.ec.keyFromPublic(keyPair.getPublic(true, "hex"), "hex");
      uiConsole(account);
      return account;
    } catch (error) {
      uiConsole(error);
      return error;
    }
  };

  const getStarkKey = async (): Promise<string | undefined> => {
    try {
      const account = await getStarkAccount();
      const publicKeyX = account.pub.getX().toString("hex");
      uiConsole(publicKeyX);
      return publicKeyX;
    } catch (error) {
      uiConsole(error);
      return error as string;
    }
  };

  const onMintRequest = async () => {
    try {
      const txId = await starkExAPI.gateway.getFirstUnusedTxId();
      const starkKey = await getStarkKey();

      const request = {
        txId,
        vaultId: 1654615998,
        amount: "6",
        tokenId: "0x400de4b5a92118719c78df48f4ff31e78de58575487ce1eaf19922ad9b8a714",
        starkKey: `0x${starkKey}`,
      };
      const response = await starkExAPI.gateway.mint(request);
      uiConsole(response);
    } catch (error) {
      uiConsole(error);
    }
  };

  const onDepositRequest = async () => {
    try {
      const txId = await starkExAPI.gateway.getFirstUnusedTxId();
      const starkKey = await getStarkKey();
      const request = {
        txId,
        amount: 8,
        starkKey: `0x${starkKey}`,
        tokenId: "0x3ef811e040c4bc9f9eee715441cee470f5d5aff69b9cd9aca7884f5a442a890",
        vaultId: 1924014660,
      };
      const response = await starkExAPI.gateway.deposit(request);
      uiConsole(response);
    } catch (error) {
      uiConsole(error);
    }
  };

  const onWithdrawalRequest = async () => {
    try {
      const txId = await starkExAPI.gateway.getFirstUnusedTxId();
      const starkKey = await getStarkKey();
      const request = {
        txId,
        amount: 8,
        starkKey: `0x${starkKey}`,
        tokenId: "0x2dd48fd7a024204f7c1bd874da5e709d4713d60c8a70639eb1167b367a9c378",
        vaultId: 612008755,
      };
      const response = await starkExAPI.gateway.withdrawal(request);
      uiConsole(response);
    } catch (error) {
      uiConsole(error);
    }
  };
  return { getStarkAccount, getStarkKey, onMintRequest, onDepositRequest, onWithdrawalRequest };
};

export default starkexProvider;
