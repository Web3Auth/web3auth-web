export interface SolletProvider {
  postMessage(...args: unknown[]): unknown;
}

export function poll(callback: () => boolean | Promise<boolean>, interval: number, count: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (count > 0) {
      setTimeout(async () => {
        const done = await callback();
        if (done) resolve(done);
        if (!done)
          poll(callback, interval, count - 1)
            .then((res) => {
              resolve(res);
              return res;
            })
            .catch((err) => reject(err));
      }, interval);
    } else {
      resolve(false);
    }
  });
}

declare global {
  interface Window {
    sollet: SolletProvider;
  }
}

export const detectProvider = async (
  options: { interval: number; count: number } = { interval: 1000, count: 3 }
): Promise<SolletProvider | undefined> => {
  const isSolletAvailable = typeof window !== "undefined" && !!window.sollet;
  if (isSolletAvailable) {
    return window.sollet;
  }
  const isAvailable = await poll(() => !!window.sollet, options.interval, options.count);
  if (isAvailable) return window.sollet;
  return undefined;
};

export const getChainNameById = (chainId: string | undefined): string => {
  let network = "";
  switch (chainId) {
    case "0x1":
      network = "mainnet-beta";
      break;
    case "0x2":
      network = "devnet";
      break;
    case "0x3":
      network = "testnet";
      break;
    default:
      break;
  }
  return network;
};
