import { get } from "@toruslabs/http-helpers";
import { BigNumber } from "bignumber.js";

import { decGWEIToHexWEI, hexWEIToDecGWEI } from "../../converter";
import { EIP1159GasData, LegacyGasData } from "./interfaces";

export function normalizeGWEIDecimalNumbers(n: string | BigNumber): string {
  const numberAsWEIHex = decGWEIToHexWEI(n);
  const numberAsGWEI = hexWEIToDecGWEI(numberAsWEIHex);
  return numberAsGWEI;
}

export async function fetchEip1159GasEstimates(url: string): Promise<EIP1159GasData> {
  const estimates: EIP1159GasData = await get(url);
  const normalizedEstimates = {
    ...estimates,
    estimatedBaseFee: normalizeGWEIDecimalNumbers(estimates.estimatedBaseFee),
    low: {
      ...estimates.low,
      suggestedMaxPriorityFeePerGas: normalizeGWEIDecimalNumbers(estimates.low.suggestedMaxPriorityFeePerGas),
      suggestedMaxFeePerGas: normalizeGWEIDecimalNumbers(estimates.low.suggestedMaxFeePerGas),
    },
    medium: {
      ...estimates.medium,
      suggestedMaxPriorityFeePerGas: normalizeGWEIDecimalNumbers(estimates.medium.suggestedMaxPriorityFeePerGas),
      suggestedMaxFeePerGas: normalizeGWEIDecimalNumbers(estimates.medium.suggestedMaxFeePerGas),
    },
    high: {
      ...estimates.high,
      suggestedMaxPriorityFeePerGas: normalizeGWEIDecimalNumbers(estimates.high.suggestedMaxPriorityFeePerGas),
      suggestedMaxFeePerGas: normalizeGWEIDecimalNumbers(estimates.high.suggestedMaxFeePerGas),
    },
  };
  return normalizedEstimates;
}

/**
 * Hit the legacy MetaSwaps gasPrices estimate api and return the low, medium
 * high values from that API.
 */
export async function fetchLegacyGasPriceEstimates(url: string): Promise<LegacyGasData> {
  const result = (await get(url, {
    referrer: url,
    referrerPolicy: "no-referrer-when-downgrade",
    method: "GET",
    mode: "cors",
  })) as {
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
  };
  return {
    low: result.SafeGasPrice,
    medium: result.ProposeGasPrice,
    high: result.FastGasPrice,
  };
}
