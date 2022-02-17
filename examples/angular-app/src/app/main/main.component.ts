import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ADAPTER_EVENTS, SafeEventEmitterProvider } from "@web3auth/base";
import { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import { Web3Auth } from "@web3auth/web3auth";
import Web3 from 'web3';
import { provider } from 'web3-core';
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE, WEB3AUTH_NETWORK_TYPE } from "../config";

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
})
export class MainComponent implements OnChanges {
  @Input() chain: CHAIN_CONFIG_TYPE = "mainnet";
  @Input() network: WEB3AUTH_NETWORK_TYPE = "cyan";

  web3auth: Web3Auth = new Web3Auth({
    clientId: "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA",
    chainConfig: CHAIN_CONFIG[this.chain],
    authMode: "DAPP",
  });
  isLoggedIn: boolean = false;
  isModalLoaded: boolean = false;
  provider: SafeEventEmitterProvider | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["chain"]) {
      return;
    }
    console.log("CHANGING CHAIN");
    this.web3auth = new Web3Auth({
      clientId: "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA",
      chainConfig: CHAIN_CONFIG[this.chain],
      authMode: "DAPP",
    });

    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data) => {
        console.log("Yeah!, you are successfully logged in", data);
        this.isLoggedIn = true;
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        this.isLoggedIn = false;
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.log("some error or user have cancelled login request", error);
      });

      web3auth.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible) => {
        console.log("modal visibility", isVisible);
      });
    };

    const initializeModal = async () => {
      console.log("INIT MODAL");
      subscribeAuthEvents(this.web3auth);
      await this.web3auth.initModal();
      this.isModalLoaded = true;

      if (this.isLoggedIn && !this.provider) {
        this.provider = await this.web3auth.connect();
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
    this.provider = await this.web3auth.connect();
    // returns a wallet provider which can be used with various chain libraries like web3.js, ethers js etc.
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
    try {
      console.log("GETTING ACCOUNT BALANCE");
      if (!this.provider) {
        this.uiConsole("provider is not initialized");
        return;
      }
      const web3 = new Web3(this.provider as provider);
      const accounts = await web3.eth.getAccounts();
      const balance = await web3.eth.getBalance(accounts[0]);
      this.uiConsole("Account Balance", balance);
    } catch (error) {
      this.uiConsole("Error getting Account Balance", error);
    }
  }

  async getAccount() {
    console.log("GETTING ACCOUNT");
    if (!this.web3auth) {
      this.uiConsole("provider is not initialized");
      return;
    }
    try {
      const web3 = new Web3(this.provider as provider);
      const accounts = await web3.eth.getAccounts();
      this.uiConsole("Account", accounts[0]);
    } catch (error) {
      this.uiConsole("Error getting Account", error);
    }
  }

   uiConsole(...args: unknown[]): void {
    const el = document.querySelector("#console-ui>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  };
}
