import { isValidAddress } from "@ethereumjs/util";
import { get } from "@toruslabs/http-helpers";
import { BigNumber } from "bignumber.js";

import { TypedMessageParams } from "../../../rpc/interfaces";
import { decGWEIToHexWEI, hexWEIToDecGWEI } from "../../converter";
import { EIP1159GasData, EthereumGasFeeEstimates, LegacyGasData } from "./interfaces";

export function normalizeGWEIDecimalNumbers(n: string | BigNumber): string {
  const numberAsWEIHex = decGWEIToHexWEI(n);
  const numberAsGWEI = hexWEIToDecGWEI(numberAsWEIHex).toString();
  return numberAsGWEI;
}

export async function fetchEip1159GasEstimates(url: string): Promise<EthereumGasFeeEstimates> {
  const estimates = await get<EIP1159GasData>(url);
  const normalizedEstimates: EthereumGasFeeEstimates = {
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
  const result = await get<{
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
  }>(url, {
    referrer: url,
    referrerPolicy: "no-referrer-when-downgrade",
    method: "GET",
    mode: "cors",
  });
  return {
    low: result.SafeGasPrice,
    medium: result.ProposeGasPrice,
    high: result.FastGasPrice,
  };
}

export function validateAddress(address: string, propertyName: string) {
  if (!address || typeof address !== "string" || !isValidAddress(address)) {
    throw new Error(`Invalid "${propertyName}" address: ${address} must be a valid string.`);
  }
}

export async function validateTypedSignMessageDataV4(messageData: TypedMessageParams, currentChainId: string) {
  validateAddress(messageData.from, "from");

  if (!messageData.data || Array.isArray(messageData.data) || (typeof messageData.data !== "object" && typeof messageData.data !== "string")) {
    throw new Error(`Invalid message "data": Must be a valid string or object.`);
  }

  let data;
  if (typeof messageData.data === "object") {
    data = messageData.data;
  } else {
    try {
      data = JSON.parse(messageData.data);
    } catch (e) {
      throw new Error("Data must be passed as a valid JSON string.");
    }
  }

  if (!currentChainId) {
    throw new Error("Current chainId cannot be null or undefined.");
  }

  let { chainId } = data.domain;
  if (chainId) {
    if (typeof chainId === "string") {
      chainId = parseInt(chainId, chainId.startsWith("0x") ? 16 : 10);
    }

    const activeChainId = parseInt(currentChainId, 16);
    if (Number.isNaN(activeChainId)) {
      throw new Error(`Cannot sign messages for chainId "${chainId}", because Web3Auth is switching networks.`);
    }

    if (chainId !== activeChainId) {
      throw new Error(`Provided chainId "${chainId}" must match the active chainId "${activeChainId}"`);
    }
  }
}
