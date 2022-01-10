import { SafeEventEmitterProvider } from "@web3auth/base";
import { Connection, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js"
import { SolanaWallet } from "@web3auth/solana-provider"

export const signAndSendTransaction  = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
      const conn = new Connection("https://api.devnet.solana.com")
      const solWeb3 = new SolanaWallet(provider)
      const pubKey = await solWeb3.requestAccounts()
      const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(pubKey[0]),
        toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
        lamports: 0.01 * LAMPORTS_PER_SOL
      });
      let transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
      const signature = await solWeb3.signAndSendTransaction(transaction)
      uiConsole("signature", signature)
  } catch (error) {
    console.error("Error", error)
    uiConsole("error", error)
  }
}

export const signTransaction  = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
      const conn = new Connection("https://api.devnet.solana.com")
      const solWeb3 = new SolanaWallet(provider)
      const pubKey = await solWeb3.requestAccounts()
      const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
      console.log("blockhash", blockhash)
      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(pubKey[0]),
        toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
        lamports: 0.01 * LAMPORTS_PER_SOL
      });
      let transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
      const signedTx = await solWeb3.signTransaction(transaction)
      uiConsole("signature", signedTx)
  } catch (error) {
    console.error("Error", error)
    uiConsole("error", error)
  }
}

export const signMessage = async (provider: SafeEventEmitterProvider, uiConsole: any) => {
  try {
    const solWeb3 = new SolanaWallet(provider)
    let msg = Buffer.from("Test Signing Message ", "utf8");
    const res = await solWeb3.signMessage(msg);
    uiConsole(res);
  } catch (error) {
    console.error("Error", error)
    uiConsole("error", error)
  }
};
