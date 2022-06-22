//@ts-ignore
import * as tezosCrypto from "@tezos-core-tools/crypto-utils";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { TezosToolkit } from '@taquito/taquito';
import { hex2buf } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';
import { IWalletProvider } from "./walletProvider";

const tezosProvider = (provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {
  const tezos = new TezosToolkit('https://ithacanet.ecadinfra.com');

  const getTezosKeyPair = async () => {
    try {
      const privateKey = await provider.request({ method: "private_key" }) as string;
      const keyPair = tezosCrypto.utils.seedToKeyPair(hex2buf(privateKey));
      return keyPair;
    } catch (error) {
      return error;
    }
  }

  const setProvider = async () => {
    const keyPair = await getTezosKeyPair();
    // use TacoInfra's RemoteSigner for better security on mainnet..
    tezos.setSignerProvider(await InMemorySigner.fromSecretKey(keyPair.sk));
  }

  const getAccounts = async () => {
    try {
      uiConsole("Method not implemented.")
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getBalance = async () => {
    try {
      const keyPair = await getTezosKeyPair();
      const balance = await tezos.tz.getBalance(keyPair.pkh);
      uiConsole("Tezos balance", balance);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signMessage = async () => {
    try {
      uiConsole("Method not implemented.")
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signAndSendTransaction = async () => {
    try {
      await setProvider();
      // example address.
      const address = 'tz1dHzQTA4PGBk2igZ3kBrDsVXuvHdN8kvTQ';

      const op = await tezos.wallet.transfer({
        to: address,
        amount: 0.000005,
      }).send();

      const txRes = await op.confirmation();
      uiConsole("txRes", txRes);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signTransaction = async () => {
    try {
      uiConsole("Method not implemented.")
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };
  return { getAccounts, getBalance, signMessage, signAndSendTransaction, signTransaction };
};

export default tezosProvider;
