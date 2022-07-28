import { Component } from "@angular/core";

import { CHAIN_CONFIG_TYPE } from "../config/chains";
import { WEB3AUTH_NETWORK_TYPE } from "../config/web3auth-networks";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "angular-app";

  chain: CHAIN_CONFIG_TYPE = "mainnet";

  network: WEB3AUTH_NETWORK_TYPE = "cyan";

  isLoggedIn = false;

  selectChain(chain: string) {
    this.chain = chain as CHAIN_CONFIG_TYPE;
  }

  selectNetwork(network: string) {
    this.network = network as WEB3AUTH_NETWORK_TYPE;
  }

  setLoginStatus(status: boolean) {
    this.isLoggedIn = status;
  }
}
