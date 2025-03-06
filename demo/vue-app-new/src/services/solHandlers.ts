/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { CustomChainConfig, IProvider, log, SolanaWallet, TransactionOrVersionedTransaction  } from "@web3auth/modal";
import base58 from "bs58";

const getConnection = async (provider: IProvider): Promise<Connection> => {
  const solanaWallet = new SolanaWallet(provider);

  const connectionConfig = await solanaWallet.request<never, CustomChainConfig>({ method: "solana_provider_config" });
  const conn = new Connection(connectionConfig.rpcTarget);
  return conn;
};

function getNewTx(publicKeys: any, blockhash: any) {
  const inst = SystemProgram.transfer({
    fromPubkey: new PublicKey(publicKeys[0]),
    toPubkey: new PublicKey(publicKeys[0]),
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });
  return new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(publicKeys![0]) }).add(inst);
}

export const getAccounts = async (provider: IProvider, uiConsole: any): Promise<string[] | undefined> => {
  try {
    const solWeb3 = new SolanaWallet(provider);
    const acc = await solWeb3.requestAccounts();
    uiConsole("accounts", acc);
    return acc;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return [];
  }
};

export const getBalance = async (provider: IProvider, uiConsole: any): Promise<void> => {
  try {
    const conn = await getConnection(provider);
    const solanaWallet = new SolanaWallet(provider);
    const accounts = await solanaWallet.requestAccounts();
    const balance = await conn.getBalance(new PublicKey(accounts[0]));
    uiConsole("balance", { balance });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};

export const signAndSendTransaction = async (provider: IProvider, uiConsole: any) => {
  try {
    const conn = await getConnection(provider);
    const solWeb3 = new SolanaWallet(provider);
    const pubKey = await solWeb3.requestAccounts();

    const block = await conn.getLatestBlockhash("finalized");
    const transactionInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(pubKey[0]),
      toPubkey: new PublicKey(pubKey[0]),
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });

    const transaction = new Transaction({
      blockhash: block.blockhash,
      lastValidBlockHeight: block.lastValidBlockHeight,
      feePayer: new PublicKey(pubKey[0]),
    }).add(transactionInstruction);

    const signature = await solWeb3.signAndSendTransaction(transaction as unknown as TransactionOrVersionedTransaction);
    uiConsole("signature", { signature });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};

export const signTransaction = async (provider: IProvider, uiConsole: any) => {
  try {
    const conn = await getConnection(provider);
    const solWeb3 = new SolanaWallet(provider);
    const pubKey = await solWeb3.requestAccounts();
    log.info("pubKey", pubKey);

    const transactionInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(pubKey[0]),
      toPubkey: new PublicKey(pubKey[0]),
      lamports: 0 * LAMPORTS_PER_SOL,
    });

    const block = await conn.getLatestBlockhash("finalized");
    const transaction = new Transaction({
      blockhash: block.blockhash,
      lastValidBlockHeight: block.lastValidBlockHeight,
      feePayer: new PublicKey(pubKey[0]),
    }).add(transactionInstruction);

    const signature = await solWeb3.signTransaction(transaction);
    log.info("signedTx", signature);
    uiConsole("signature", { signature });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};

export const signMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const solWeb3 = new SolanaWallet(provider);
    const pubKey = await solWeb3.requestAccounts();
    log.info("pubKey", pubKey);

    const msg = "Test Signing Message";
    const signature = await solWeb3.signMessage(msg, pubKey[0]);
    uiConsole("solana signed message", { signature });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};

export const signAllTransactions = async (provider: IProvider, uiConsole: any) => {
  try {
    const conn = await getConnection(provider);
    const solWeb3 = new SolanaWallet(provider);
    const publicKeys = await solWeb3.requestAccounts();
    const { blockhash } = await conn.getLatestBlockhash("finalized");
    log.info("blockhash", blockhash);

    const signedTransactions = await solWeb3.signAllTransactions([
      getNewTx(publicKeys, blockhash) as unknown as TransactionOrVersionedTransaction,
      getNewTx(publicKeys, blockhash) as unknown as TransactionOrVersionedTransaction,
      getNewTx(publicKeys, blockhash) as unknown as TransactionOrVersionedTransaction,
    ]);
    log.info("signedTransactions", signedTransactions);
    uiConsole("signed transactions", { signedTransactions });
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};
