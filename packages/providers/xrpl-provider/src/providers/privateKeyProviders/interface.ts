import { XRPLNetwork } from "./constants";

export type XRPLNetworkType = (typeof XRPLNetwork)[keyof typeof XRPLNetwork];
