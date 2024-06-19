import { Hex } from "viem";

export type AaTransaction = {
  to: Hex;
  value: bigint;
  data: Hex;
};

export interface IAaAdapter {
  getSmartAccountAddress(): Promise<string>;
  sendTransaction(txData: AaTransaction): Promise<string>;
}
