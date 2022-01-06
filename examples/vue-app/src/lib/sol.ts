import { SafeEventEmitterProvider } from "@web3auth/base";
import { Connection, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js"
import { SolanaProviderWrapper } from "@web3auth/solana-provider"
import bs58 from "bs58";

export const signAndSendTransaction  = async (provider: SafeEventEmitterProvider, console: any) => {
  try {
      const conn = new Connection("https://api.devnet.solana.com")
      // const solWeb3 = new SolanaProviderWrapper(provider)
      const pubKey = bs58.encode((window as any).solana.publicKey.toBytes())
      const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(pubKey[0]),
        toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
        lamports: 0.01 * LAMPORTS_PER_SOL
      });
      let transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
      const signature = await (window as any).solana.signAndSendTransaction(transaction)
      console("signature", signature)
  } catch (error) {
    console("error", error)
  }
}

export const signAndSendTransactionTest  = async () => {
  try {
      const conn = new Connection("https://api.devnet.solana.com")
      // const solWeb3 = new SolanaProviderWrapper(provider)
      const pubKey = bs58.encode((window as any).solana.publicKey.toBytes())
      const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
      const TransactionInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(pubKey[0]),
        toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
        lamports: 0.01 * LAMPORTS_PER_SOL
      });
      let transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
      const signature = await (window as any).solana.signAndSendTransaction(transaction)
      console.log("signature", signature)
  } catch (error) {
    console.log("error", error)
  }
}