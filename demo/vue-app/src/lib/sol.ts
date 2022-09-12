import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { SolanaWallet } from "@web3auth/solana-provider";
const getConnection = async (provider: SafeEventEmitterProvider): Promise<Connection> => {
  const solanaWallet = new SolanaWallet(provider);

  const connectionConfig = await solanaWallet.request<CustomChainConfig>({ method: "solana_provider_config", params: [] });
  const conn = new Connection(connectionConfig.rpcTarget);
  return conn;
};

function getNewTx(publicKeys, blockhash) {
  const inst = SystemProgram.transfer({
    fromPubkey: new PublicKey(publicKeys[0]),
    toPubkey: new PublicKey(publicKeys[0]),
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });
  return new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(publicKeys![0]) }).add(inst);
}

export const getAccounts = async (provider: SafeEventEmitterProvider, uiConsole: any): Promise<string[] | undefined> => {
  try {
    const solWeb3 = new SolanaWallet(provider);
    const acc = await solWeb3.requestAccounts();
    uiConsole("accounts", acc);
    return acc;
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};
export const getBalance = async (provider: SafeEventEmitterProvider, uiConsole: any): Promise<void> => {
  try {
    const conn = await getConnection(provider);
    const solanaWallet = new SolanaWallet(provider);
    const accounts = await solanaWallet.requestAccounts();
    const balance = await conn.getBalance(new PublicKey(accounts[0]));
    uiConsole("balance", balance);
    return;
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};

export const signAndSendTransaction = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
    const conn = await getConnection(provider);
    const solWeb3 = new SolanaWallet(provider);
    const pubKey = await solWeb3.requestAccounts();
    const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
    const TransactionInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(pubKey[0]),
      toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
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

export const signTransaction = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
    const conn = await getConnection(provider);
    const solWeb3 = new SolanaWallet(provider);
    const pubKey = await solWeb3.requestAccounts();
    const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
    const TransactionInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(pubKey[0]),
      toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });
    const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
    const signedTx = await solWeb3.signTransaction(transaction);

    // const res = await conn.sendRawTransaction(signedTx.serialize());
    uiConsole("signature", signedTx);
    return { signature: signedTx };
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};

export const signMessage = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
    const solWeb3 = new SolanaWallet(provider);
    const msg = Buffer.from("Test Signing Message ", "utf8");
    const res = await solWeb3.signMessage(msg);
    uiConsole(res);
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};

export const signAllTransactions = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
    const conn = await getConnection(provider);
    const solWeb3 = new SolanaWallet(provider);
    const publicKeys = await solWeb3.requestAccounts();
    const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
    console.log("blockhash", blockhash);

    const signedTx = await solWeb3.signAllTransactions([
      getNewTx(publicKeys, blockhash),
      getNewTx(publicKeys, blockhash),
      getNewTx(publicKeys, blockhash),
    ]);
    console.log("signedTx", signedTx);
    uiConsole("signature", signedTx);
  } catch (error) {
    console.error("Error", error);
    uiConsole("error", error);
  }
};
