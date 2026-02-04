import { SafeEventEmitter } from "@web3auth/auth";

import { StateEmitterEvents } from "../../interfaces";

export interface WidgetProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
}
