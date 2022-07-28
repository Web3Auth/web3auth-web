/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { ADAPTER_EVENTS } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { Web3Auth } from "@web3auth/web3auth";

import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../../config/chains";
import { WEB3AUTH_NETWORK_TYPE } from "../../config/web3auth-networks";
import { getWalletProvider, IWalletProvider } from "../../services/wallet-provider";

const clientId = "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA";
@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
})
export class MainComponent implements OnChanges {
  @Input() chain: CHAIN_CONFIG_TYPE = "mainnet";

  @Input() network: WEB3AUTH_NETWORK_TYPE = "cyan";

  @Output() loginStatusEvent = new EventEmitter<boolean>();

  web3auth: Web3Auth | null = null;

  isLoggedIn = false;

  isModalLoaded = false;

  provider: IWalletProvider | null = null;

  setLoginStatus(status: boolean): void {
    this.isLoggedIn = status;
    this.loginStatusEvent.emit(status);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line dot-notation
    if (!changes["chain"] && !changes["network"]) {
      return;
    }
    console.log("CHANGING CHAIN");

    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data) => {
        console.log("Yeah!, you are successfully logged in", data);
        this.setLoginStatus(true);
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        this.setLoginStatus(false);
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.log("some error or user have cancelled login request", error);
      });
    };

    const initializeModal = async () => {
      console.log("INIT MODAL");
      this.web3auth = new Web3Auth({
        clientId,
        chainConfig: CHAIN_CONFIG[this.chain],
      });
      const adapter = new OpenloginAdapter({ adapterSettings: { network: this.network, clientId } });
      this.web3auth.configureAdapter(adapter);

      subscribeAuthEvents(this.web3auth);
      await this.web3auth.initModal();
      this.isModalLoaded = true;

      if (this.isLoggedIn && !this.provider) {
        const web3authProvider = await this.web3auth.connect();
        if (web3authProvider) this.provider = getWalletProvider(this.chain, web3authProvider, this.uiConsole);
      }
    };
    initializeModal();
  }

  async login() {
    console.log("LOGGING IN");
    if (!this.web3auth) {
      console.log("Web3auth is not initialized");
      return;
    }
    const web3authProvider = await this.web3auth.connect();
    if (web3authProvider) this.provider = getWalletProvider(this.chain, web3authProvider, this.uiConsole);
  }

  async logout() {
    console.log("LOGGING OUT");
    if (!this.web3auth) {
      console.log("Web3auth is not initialized");
      return;
    }
    await this.web3auth.logout();
    this.provider = null;
  }

  async getUserInfo() {
    console.log("GETTING USER INFO");
    if (!this.web3auth) {
      console.log("Web3auth is not initialized");
      return;
    }
    const userInfo = await this.web3auth.getUserInfo();
    this.uiConsole("User Info", userInfo);
  }

  async getBalance() {
    console.log("GETTING ACCOUNT BALANCE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.getBalance();
  }

  async getAccount() {
    console.log("GETTING ACCOUNT");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.getAccounts();
  }

  async signMessage() {
    console.log("SIGNING MESSAGE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.signMessage();
  }

  async signTransaction() {
    console.log("SIGNING MESSAGE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.signTransaction();
  }

  async signAndSendTransaction() {
    console.log("SIGNING MESSAGE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.signAndSendTransaction();
  }

  uiConsole(...args: unknown[]): void {
    const el = document.querySelector("#console-ui>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }
}
