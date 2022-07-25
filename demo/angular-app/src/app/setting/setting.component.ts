import { Component, EventEmitter, Input, Output } from "@angular/core";

import { CHAIN_CONFIG } from "../../config/chains";
import { WEB3AUTH_NETWORK } from "../../config/web3auth-networks";

@Component({
  selector: "app-setting",
  templateUrl: "./setting.component.html",
  styleUrls: ["./setting.component.css"],
})
export class SettingComponent {
  @Output() selectChainEvent = new EventEmitter<string>();

  @Output() selectNetworkEvent = new EventEmitter<string>();

  @Input() isLoggedIn = false;

  networks = WEB3AUTH_NETWORK;

  chains = CHAIN_CONFIG;

  selectChain(e: Event) {
    const el = e.target as HTMLInputElement;
    this.selectChainEvent.emit(el.value);
  }

  selectNetwork(e: Event) {
    const el = e.target as HTMLInputElement;
    this.selectNetworkEvent.emit(el.value);
  }
}
