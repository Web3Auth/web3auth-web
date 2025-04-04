import { LoglevelSentry } from "@toruslabs/loglevel-sentry";
import loglevel from "loglevel";

const log = loglevel.getLogger("web3auth-logger");
const loglevelPlugin = new LoglevelSentry();
loglevelPlugin.install(log);

export { log };
