import BN from "bn.js";
import EC from "elliptic";

export interface PointHex {
  x: string;
  y: string;
}

export function getEcCrypto(): any {
  // eslint-disable-next-line new-cap
  return new EC.ec("secp256k1");
}

export function ecPoint(p: { x: string; y: string }): any {
  const ec = getEcCrypto();
  return ec.keyFromPublic({ x: p.x.padStart(64, "0"), y: p.y.padStart(64, "0") }).getPublic();
}

export const getAdditiveCoeff = (isUser: boolean, participatingServerIndexes: number[], userTSSIndex: number, serverIndex?: number): BN => {
  const ec = getEcCrypto();
  if (isUser) {
    return getLagrangeCoeffs([1, userTSSIndex], userTSSIndex);
  }
  // generate the lagrange coeff that converts the current server DKG share into an additive sharing
  const serverLagrangeCoeff = getLagrangeCoeffs(participatingServerIndexes, serverIndex as number);
  const masterLagrangeCoeff = getLagrangeCoeffs([1, userTSSIndex], 1);
  const additiveLagrangeCoeff = serverLagrangeCoeff.mul(masterLagrangeCoeff).umod(ec.curve.n);
  return additiveLagrangeCoeff;
};

// Note: this is only needed for DKLS and not for FROST
export const getDenormaliseCoeff = (party: number, parties: number[]): BN => {
  if (parties.indexOf(party) === -1) throw new Error(`party ${party} not found in parties ${parties}`);
  const ec = getEcCrypto();
  // generate the lagrange coeff that denormalises the additive sharing into the shamir sharing that TSS is expecting
  const denormaliseLagrangeCoeff = getLagrangeCoeffs(parties, party).invm(ec.curve.n).umod(ec.curve.n);
  return denormaliseLagrangeCoeff;
};

export const getDKLSCoeff = (isUser: boolean, participatingServerIndexes: number[], userTSSIndex: number, serverIndex?: number): BN => {
  const sortedServerIndexes = participatingServerIndexes.sort((a, b) => a - b);
  for (let i = 0; i < sortedServerIndexes.length; i++) {
    if (sortedServerIndexes[i] !== participatingServerIndexes[i]) throw new Error("server indexes must be sorted");
  }
  // generate denormalise coeff for DKLS
  const parties = [];

  // total number of parties for DKLS = total number of servers + 1 (user is the last party)
  // server party indexes
  let serverPartyIndex = 0;
  for (let i = 0; i < participatingServerIndexes.length; i++) {
    const currentPartyIndex = i + 1;
    parties.push(currentPartyIndex);
    if (participatingServerIndexes[i] === serverIndex) serverPartyIndex = currentPartyIndex;
  }
  const userPartyIndex = parties.length + 1;
  parties.push(userPartyIndex); // user party index
  if (isUser) {
    const additiveCoeff = getAdditiveCoeff(isUser, participatingServerIndexes, userTSSIndex, serverIndex);
    const denormaliseCoeff = getDenormaliseCoeff(userPartyIndex, parties);
    const ec = getEcCrypto();
    return denormaliseCoeff.mul(additiveCoeff).umod(ec.curve.n);
  }
  const additiveCoeff = getAdditiveCoeff(isUser, participatingServerIndexes, userTSSIndex, serverIndex);
  const denormaliseCoeff = getDenormaliseCoeff(serverPartyIndex, parties);
  const ec = getEcCrypto();
  const coeff = denormaliseCoeff.mul(additiveCoeff).umod(ec.curve.n);
  return coeff;
};

export function getLagrangeCoeffs(_allIndexes: number[] | BN[], _myIndex: number | BN, _target: number | BN = 0): BN {
  const ec = getEcCrypto();
  const allIndexes: BN[] = _allIndexes.map((i) => new BN(i));
  const myIndex: BN = new BN(_myIndex);
  const target: BN = new BN(_target);
  let upper = new BN(1);
  let lower = new BN(1);
  for (let j = 0; j < allIndexes.length; j += 1) {
    if (myIndex.cmp(allIndexes[j]) !== 0) {
      let tempUpper = target.sub(allIndexes[j]);
      tempUpper = tempUpper.umod(ec.curve.n);
      upper = upper.mul(tempUpper);
      upper = upper.umod(ec.curve.n);
      let tempLower = myIndex.sub(allIndexes[j]);
      tempLower = tempLower.umod(ec.curve.n);
      lower = lower.mul(tempLower).umod(ec.curve.n);
    }
  }
  return upper.mul(lower.invm(ec.curve.n)).umod(ec.curve.n);
}

export function getTSSPubKey(dkgPubKey: PointHex, userSharePubKey: PointHex, userTSSIndex: number): any {
  const serverLagrangeCoeff = getLagrangeCoeffs([1, userTSSIndex], 1);
  const userLagrangeCoeff = getLagrangeCoeffs([1, userTSSIndex], userTSSIndex);
  const serverTerm = ecPoint(dkgPubKey).mul(serverLagrangeCoeff);
  const userTerm = ecPoint(userSharePubKey).mul(userLagrangeCoeff);
  return serverTerm.add(userTerm);
}
