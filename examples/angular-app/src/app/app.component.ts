import { Component, OnInit } from "@angular/core";
import { Web3Auth } from "@web3auth/web3auth";
import { CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, ADAPTER_EVENTS } from "@web3auth/base";
import { LOGIN_MODAL_EVENTS } from "@web3auth/ui";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "angular-app";
  web3auth: Web3Auth = new Web3Auth({
    clientId: "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA",
    chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155, chainId: "0x3" },
    authMode: "DAPP",
  });
  user: any;
  loaded: boolean = false;

  ngOnInit(): void {
    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data) => {
        console.log("Yeah!, you are successfully logged in", data);
        this.user = data;
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        this.user = null;
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
      this.loaded = true;
    };

    initializeModal();
  }

  async login() {
    console.log("LOGGING IN");
    const provider = await this.web3auth.connect();
  }

  async logout() {
    console.log("LOGGING OUT");
    await this.web3auth.logout();
  }

  async getUserInfo() {
    console.log("GETTING USER INFO");
    const userInfo = await this.web3auth.getUserInfo();
    console.log(userInfo);
  }
}
