export type SignFunc = (msg: Buffer) => Promise<Buffer>;
export type GetPubKeyFunc = () => Promise<Buffer>;
export type SigningMethods = {
  sign: SignFunc;
  getPubKey: GetPubKeyFunc;
};

export * from "./provider";
