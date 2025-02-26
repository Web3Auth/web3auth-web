import { BaseControllerEvents } from "@toruslabs/base-controllers";
import { ProviderEvents } from "@web3auth/base";

export type BaseProviderEvents<S> = ProviderEvents & BaseControllerEvents<S>;
