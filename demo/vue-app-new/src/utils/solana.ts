import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export async function generateSolTransferInstruction(sender: string, receiver: string, amount: number) {
  return SystemProgram.transfer({
    fromPubkey: new PublicKey(sender),
    toPubkey: new PublicKey(receiver),
    lamports: amount * LAMPORTS_PER_SOL,
  });
}

export async function generateLegacyTransaction(connection: Connection | null, sender: string, instructions: TransactionInstruction[]) {
  if (!connection) throw new Error("Connection not found");
  const latestBlockhash = await connection.getLatestBlockhash("finalized");
  const transaction = new Transaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    feePayer: new PublicKey(sender),
  }).add(...instructions);
  return transaction;
}

export async function generateVersionedTransaction(connection: Connection | null, sender: string, instructions: TransactionInstruction[]) {
  if (!connection) throw new Error("Connection not found");
  const latestBlockhash = await connection.getLatestBlockhash("finalized");
  // create v0 compatible message
  const messageV0 = new TransactionMessage({
    payerKey: new PublicKey(sender),
    instructions,
    recentBlockhash: latestBlockhash.blockhash,
  }).compileToV0Message();
  const transactionV0 = new VersionedTransaction(messageV0);
  return transactionV0;
}
