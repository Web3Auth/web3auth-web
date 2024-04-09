/// <reference types="node" />
import { SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";
import { IProviderHandlers } from "../../rpc/interfaces";
import { TransactionFormatter } from "../TransactionFormatter";
export declare function getProviderHandlers({ txFormatter, sign, getPublic, getProviderEngineProxy, }: {
    txFormatter: TransactionFormatter;
    sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    getPublic: () => Promise<Buffer>;
    getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers;
