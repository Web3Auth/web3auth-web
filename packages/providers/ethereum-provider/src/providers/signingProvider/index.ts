export type SignFunc = (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
export type GetPubKeyFunc = () => Promise<Buffer>;
export type SigningMethods = {
  sign: SignFunc;
  getPubKey: GetPubKeyFunc;
};

export * from "./provider";
export * from "./utils";
