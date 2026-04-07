/**
 * Browser Vitest runs without Node's `process`. Some dependencies reference `process` at module load time.
 */
if (typeof globalThis.process === "undefined") {
  Object.defineProperty(globalThis, "process", {
    value: { env: {} },
    writable: true,
    configurable: true,
  });
}
