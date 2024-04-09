import { BigNumber } from "bignumber.js";
import { TypedMessageParams } from "../../rpc/interfaces";
import { EthereumGasFeeEstimates, LegacyGasData } from "./interfaces";
export declare function normalizeGWEIDecimalNumbers(n: string | BigNumber): string;
export declare function fetchEip1159GasEstimates(url: string): Promise<EthereumGasFeeEstimates>;
/**
 * Hit the legacy MetaSwaps gasPrices estimate api and return the low, medium
 * high values from that API.
 */
export declare function fetchLegacyGasPriceEstimates(url: string): Promise<LegacyGasData>;
export declare const validateTypedMessageParams: (parameters: TypedMessageParams<unknown>, activeChainId: number) => void;
