import { ChainNotConfiguredError, createConnector, type CreateConnectorFn } from "@wagmi/core";
import { CONNECTOR_EVENTS, type IProvider } from "@web3auth/no-modal";
import { Address, type Chain, getAddress, SwitchChainError } from "viem";

import { type Web3Auth } from "../../modalManager";

export const WEB3AUTH_CONNECTOR_ID = "web3auth";

export function createWeb3AuthConnector(web3auth: Web3Auth): CreateConnectorFn<IProvider> {
  return createConnector<IProvider>((config) => ({
    id: WEB3AUTH_CONNECTOR_ID,
    name: "Web3Auth",
    type: "web3auth",
    async connect({ isReconnecting }) {
      config.emitter.emit("message", {
        type: "connecting",
      });

      if (isReconnecting) {
        const accounts = await this.getAccounts().catch(() => []);
        return {
          accounts: accounts,
          chainId: Number(web3auth.currentChainId),
        };
      }

      const provider = await web3auth.connect();
      if (provider) {
        const accounts = await this.getAccounts();
        return {
          accounts: accounts,
          chainId: Number(provider.chainId),
        };
      }
      return {
        accounts: [],
        chainId: 0,
      };
    },
    async getAccounts(): Promise<readonly Address[]> {
      const provider = await this.getProvider();
      return (
        await provider.request<unknown, string[]>({
          method: "eth_accounts",
        })
      ).map((x: string) => getAddress(x));
    },
    async getChainId() {
      const provider = await this.getProvider();
      return Number(provider.chainId);
    },
    async getProvider(): Promise<IProvider> {
      if (web3auth.status !== "not_ready") {
        if (web3auth.provider) {
          const provider = web3auth.provider;
          provider.on("accountsChanged", this.onAccountsChanged);
          provider.on("chainChanged", this.onChainChanged);
          provider.on("disconnect", this.onDisconnect.bind(this));
          return web3auth.provider;
        }

        return web3auth.provider;
      }

      // else wait for web3auth to be ready.
      return new Promise((resolve) => {
        const handleReadyEvent = () => {
          web3auth.off(CONNECTOR_EVENTS.READY, handleReadyEvent);
          web3auth.off(CONNECTOR_EVENTS.CONNECTED, handleConnectedEvent);
          resolve(web3auth.provider);
        };

        const handleConnectedEvent = () => {
          web3auth.off(CONNECTOR_EVENTS.CONNECTED, handleConnectedEvent);
          web3auth.off(CONNECTOR_EVENTS.READY, handleReadyEvent);
          resolve(web3auth.provider);
        };

        web3auth.on(CONNECTOR_EVENTS.READY, handleReadyEvent);
        web3auth.on(CONNECTOR_EVENTS.CONNECTED, handleConnectedEvent);
      });
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },
    async switchChain({ chainId }): Promise<Chain> {
      try {
        const chain = config.chains.find((x) => x.id === chainId);
        if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

        await web3auth.switchChain({ chainId: `0x${chain.id.toString(16)}` });
        config.emitter.emit("change", {
          chainId,
        });
        return chain;
      } catch (error: unknown) {
        throw new SwitchChainError(error as Error);
      }
    },
    async disconnect() {
      await web3auth.logout();
      const provider = await this.getProvider();
      provider.removeListener("accountsChanged", this.onAccountsChanged);
      provider.removeListener("chainChanged", this.onChainChanged);
      provider.removeListener("disconnect", this.onDisconnect);
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) config.emitter.emit("disconnect");
      else
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },
    onDisconnect(): void {
      config.emitter.emit("disconnect");
    },
  }));
}
