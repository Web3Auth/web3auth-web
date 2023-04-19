import { WEB3AUTH_NETWORK } from "./constants";
import { WEB3AUTH_NETWORK_TYPE } from "./interfaces";

export const generateTSSEndpoints = (network: WEB3AUTH_NETWORK_TYPE, parties: number, clientIndex: number) => {
  const endpoints: string[] = [];
  const tssWSEndpoints: string[] = [];
  const partyIndexes: number[] = [];
  for (let i = 0; i < parties; i++) {
    partyIndexes.push(i);
    if (i === clientIndex) {
      endpoints.push(null as any);
      tssWSEndpoints.push(null as any);
    } else if (network === WEB3AUTH_NETWORK.TESTNET) {
      endpoints.push(`https://sapphire-dev-2-${i + 1}.authnetwork.dev/tss`);
      tssWSEndpoints.push(`https://sapphire-dev-2-${i + 1}.authnetwork.dev`);
    } else {
      endpoints.push(`https://sapphire-${i + 1}.auth.network/tss`);
      tssWSEndpoints.push(`https://sapphire-${i + 1}.auth.network`);
    }
  }
  return { endpoints, tssWSEndpoints, partyIndexes };
};
