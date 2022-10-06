import { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin-mpc";
import { CustomChainConfig } from "@web3auth-mpc/base";

export type LoginSettings = LoginParams & Partial<BaseRedirectParams>;

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;
export interface OpenloginAdapterOptions {
  chainConfig?: CustomChainConfig | null;
  adapterSettings?: MakeOptional<OpenLoginOptions, "clientId">;
  loginSettings?: LoginSettings;
  tssSettings?: {
    useTSS: boolean;
    tssSign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    tssGetPublic: () => Promise<Buffer>;
    tssDataCallback: (tssDataReader: () => Promise<{ tssShare: string; signatures: string[] }>) => Promise<void>;
  };
}
