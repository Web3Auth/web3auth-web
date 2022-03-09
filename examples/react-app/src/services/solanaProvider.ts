import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";
import { IWalletProvider } from "./walletProvider";

const solanaProvider = (provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {
  const solanaWallet = new SolanaWallet(provider);

  const getConnection = async (): Promise<Connection> => {
    const connectionConfig = await solanaWallet.request<CustomChainConfig>({ method: "solana_provider_config", params: [] });
    const conn = new Connection(connectionConfig.rpcTarget);
    return conn
  }

  const getAccounts = async (): Promise<string[]> => {
    try {
      const acc = await solanaWallet.requestAccounts();
      uiConsole("Solana accounts", acc);
      return acc;
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
      return [];
    }
  };

  const getBalance = async () => {
    try {
      const conn = await getConnection();
      const accounts = await solanaWallet.requestAccounts();
      const balance = await conn.getBalance(new PublicKey(accounts[0]));
      uiConsole("Solana balance", balance);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signMessage = async (): Promise<void> => {
    try {
      const msg = Buffer.from("Test Signing Message ", "utf8");
      const res = await solanaWallet.signMessage(msg);
      uiConsole("Solana sign message", res);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signAndSendTransaction = async (): Promise<void> => {
    try {
      const conn = await getConnection();
      const solWeb3 = new SolanaWallet(provider);
      const pubKey = await solWeb3.requestAccounts();
      const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(pubKey[0]),
        toPubkey: new PublicKey(pubKey[0]),
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });
      const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
      const signature = await solWeb3.signAndSendTransaction(transaction);
      uiConsole("signature", signature);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };
  
  const signTransaction = async ():  Promise<void> => {
    try {
      const conn = await getConnection();
      const solWeb3 = new SolanaWallet(provider);
      const pubKey = await solWeb3.requestAccounts();
      const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(pubKey[0]),
        toPubkey: new PublicKey(pubKey[0]),
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });
      const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
      const signedTx = await solWeb3.signTransaction(transaction);
      signedTx.serialize();
      uiConsole("signature", signedTx);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  return { getAccounts, getBalance, signMessage, signAndSendTransaction, signTransaction };
};

export default solanaProvider;
