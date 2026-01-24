import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  type Instruction,
  lamports,
  pipe,
  type Rpc,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type SolanaRpcApi,
  type Transaction,
} from "@solana/kit";
import { getTransferSolInstruction, type TransferSolInstruction } from "@solana-program/system";

/**
 * Generates a SOL transfer instruction
 * Uses a noop signer since the actual signing happens in the wallet
 */
export function generateSolTransferInstruction(sender: string, receiver: string, amount: number): TransferSolInstruction {
  // Create a noop signer for the source - the wallet will sign later
  const sourceSigner = createNoopSigner(address(sender));

  return getTransferSolInstruction({
    source: sourceSigner,
    destination: address(receiver),
    amount: lamports(BigInt(Math.floor(amount * 1_000_000_000))),
  });
}

/**
 * Generates a versioned transaction (v0)
 * @param rpc - Solana RPC client
 * @param sender - Sender's address (base58)
 * @param instructions - Array of instructions to include
 * @returns Compiled Transaction ready for signing
 */
export async function generateVersionedTransaction(rpc: Rpc<SolanaRpcApi> | null, sender: string, instructions: Instruction[]): Promise<Transaction> {
  if (!rpc) throw new Error("RPC not found");

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Build transaction message using pipe
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayer(address(sender), m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m)
  );

  // Compile to Transaction
  return compileTransaction(message);
}

/**
 * Generates a legacy transaction
 * @param rpc - Solana RPC client
 * @param sender - Sender's address (base58)
 * @param instructions - Array of instructions to include
 * @returns Compiled Transaction ready for signing
 */
export async function generateLegacyTransaction(rpc: Rpc<SolanaRpcApi> | null, sender: string, instructions: Instruction[]): Promise<Transaction> {
  if (!rpc) throw new Error("RPC not found");

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Build legacy transaction message using pipe
  const message = pipe(
    createTransactionMessage({ version: "legacy" }),
    (m) => setTransactionMessageFeePayer(address(sender), m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m)
  );

  // Compile to Transaction
  return compileTransaction(message);
}
