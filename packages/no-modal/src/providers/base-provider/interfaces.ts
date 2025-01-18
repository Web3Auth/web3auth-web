import { BaseControllerEvents } from "@toruslabs/base-controllers";

import { ProviderEvents } from "@/core/base";

export type BaseProviderEvents<S> = ProviderEvents & BaseControllerEvents<S>;
