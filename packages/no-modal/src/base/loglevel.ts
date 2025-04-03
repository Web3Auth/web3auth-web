import { LoglevelSentry } from "@toruslabs/loglevel-sentry";
import loglevel from "loglevel";

const log = loglevel.getLogger("web3auth-logger");
// TODO: remove this once we make Sentry optional in loglevel-sentry package
const loglevelPlugin = new LoglevelSentry({
  getActiveSpan: () => undefined,
  addBreadcrumb: () => {},
  captureException: () => "",
  getClient: (): undefined => undefined,
});
loglevelPlugin.install(log);

export { log };
