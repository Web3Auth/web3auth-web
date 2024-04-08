import BN from "bn.js";
export declare function bnLessThan(a: string | number, b: string | number): boolean;
export declare function bnToHex(inputBn: BN): string;
export declare function hexToBn(inputHex: string): BN;
export declare function BnMultiplyByFraction(targetBN: BN, numerator: number | string, denominator: number | string): BN;
