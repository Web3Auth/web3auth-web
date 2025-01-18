export interface IAccountHandlers {
  updatePrivatekey?: (params: { privateKey: string }) => Promise<void>;
  updateSignMethods?: (params: {
    signMethods: {
      sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    };
  }) => Promise<void>;
}
