import type { ISlopeProvider } from "@web3auth/solana-provider";

interface SlopeWindow extends Window {
  Slope?: {
    new (): ISlopeProvider;
  };
  slopeApp?: unknown;
}

declare const window: SlopeWindow;

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

export const detectProvider = async (options: { interval: number; count: number } = { interval: 1000, count: 3 }): Promise<ISlopeProvider | null> => {
  const isSlopeAvailable = typeof window.Slope === "function";
  if (isSlopeAvailable && window.Slope) {
    return new window.Slope();
  }
  const isAvailable = await poll(() => !!window.Slope, options.interval, options.count);
  if (isAvailable && window.Slope) return new window.Slope();
  return null;
};
