import { GAS_ESTIMATE_TYPES, TRANSACTION_TYPES } from "./constants";

export type LegacyGasData = {
  low: string;
  medium: string;
  high: string;
};

export type EIP1559GasDataItem = {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
};

export type EthereumGasFeeEstimates = {
  estimatedBaseFee: string;
  low: EIP1559GasDataItem;
  medium: EIP1559GasDataItem;
  high: EIP1559GasDataItem;
};

export type EIP1159GasData = EthereumGasFeeEstimates & {
  networkCongestion: number;
  latestPriorityFeeRange: string[];
  historicalPriorityFeeRange: string[];
  historicalBaseFeeRange: string[];
  priorityFeeTrend: string;
  baseFeeTrend: string;
};

export type FallbackGasData = {
  gasPrice: string;
};

export type TxType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

export type GasType = (typeof GAS_ESTIMATE_TYPES)[keyof typeof GAS_ESTIMATE_TYPES];

export type GasData = {
  gasEstimateType: string;
  gasFeeEstimates: LegacyGasData | EthereumGasFeeEstimates | FallbackGasData;
};

export interface FeeHistoryResponse {
  baseFeePerGas: string[];
  gasUsedRatio: string[];
  oldestBlock: string;
  reward: string[][];
}

export enum SignTypedDataVersion {
  V1 = "V1",
  V3 = "V3",
  V4 = "V4",
}
