import type { SafeEventEmitterProvider } from "@web3auth/no-modal";
import Web3 from "web3";

export default class EthereumRpc {
  private provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  async getChainId(): Promise<string> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get the connected Chain's ID
      const chainId = await web3.eth.getChainId();

      return chainId.toString();
    } catch (error) {
      return error as string;
    }
  }

  async getAccounts(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const address = (await web3.eth.getAccounts())[0];

      return address;
    } catch (error) {
      return error;
    }
  }

  async getBalance(): Promise<string> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const address = (await web3.eth.getAccounts())[0];

      // Get user's balance in ether
      const balance = web3.utils.fromWei(
        await web3.eth.getBalance(address) // Balance is in wei
      );

      return balance;
    } catch (error) {
      return error as string;
    }
  }

  async sendTransaction(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const fromAddress = (await web3.eth.getAccounts())[0];

      const destination = fromAddress;

      const amount = web3.utils.toWei("0.001"); // Convert 1 ether to wei

      // Submit transaction to the blockchain and wait for it to be mined
      const receipt = await web3.eth.sendTransaction({
        from: fromAddress,
        to: destination,
        value: amount,
        maxPriorityFeePerGas: "5000000000", // Max priority fee per gas
        maxFeePerGas: "6000000000000", // Max fee per gas
      });

      return receipt;
    } catch (error) {
      return error as string;
    }
  }

  async signMessage() {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const fromAddress = (await web3.eth.getAccounts())[0];

      const originalMessage = "YOUR_MESSAGE";

      // Sign the message
      const signedMessage = await web3.eth.personal.sign(
        originalMessage,
        fromAddress,
        "test password!" // configure your own password here.
      );

      return signedMessage;
    } catch (error) {
      return error as string;
    }
  }

  async getPrivateKey(): Promise<any> {
    try {
      const privateKey = await this.provider.request({
        method: "eth_private_key",
      });

      return privateKey;
    } catch (error) {
      return error as string;
    }
  }

  // ─── EIP-7702 Methods ───────────────────────────────────────────────

  /**
   * Check the EIP-7702 upgrade status for the connected account.
   * Calls `wallet_getAccountUpgradeStatus`.
   */
  async getAccountUpgradeStatus(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);
      const address = (await web3.eth.getAccounts())[0];
      const chainId = "0x" + (await web3.eth.getChainId()).toString(16);

      const result = await this.provider.request({
        method: "wallet_getAccountUpgradeStatus",
        params: [{ account: address, chainId }],
      });

      return result;
    } catch (error: any) {
      return { error: error?.message || error };
    }
  }

  /**
   * Upgrade the connected EOA to an EIP-7702 delegated account.
   * Calls `wallet_upgradeAccount`.
   */
  async upgradeAccount(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);
      const address = (await web3.eth.getAccounts())[0];
      const chainId = "0x" + (await web3.eth.getChainId()).toString(16);

      const result = await this.provider.request({
        method: "wallet_upgradeAccount",
        params: [{ account: address, chainId }],
      });

      return result;
    } catch (error: any) {
      return { error: error?.message || error };
    }
  }

  // ─── EIP-5792 Methods ───────────────────────────────────────────────

  /**
   * Get wallet capabilities for the connected account.
   * Calls `wallet_getCapabilities`.
   */
  async getCapabilities(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);
      const address = (await web3.eth.getAccounts())[0];
      const chainId = "0x" + (await web3.eth.getChainId()).toString(16);

      const result = await this.provider.request({
        method: "wallet_getCapabilities",
        params: [address, [chainId]],
      });

      return result;
    } catch (error: any) {
      return { error: error?.message || error };
    }
  }

  /**
   * Send a batch of calls using EIP-5792 `wallet_sendCalls`.
   * Sends two small self-transfers as a batch.
   * Returns the batch ID.
   */
  async sendBatchCalls(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);
      const address = (await web3.eth.getAccounts())[0];
      const chainId = "0x" + (await web3.eth.getChainId()).toString(16);

      // Two simple self-transfers as a batch
      const result = await this.provider.request({
        method: "wallet_sendCalls",
        params: [
          {
            version: "2.0",
            chainId,
            from: address,
            calls: [
              {
                to: address,
                value: "0x0",
                data: "0x",
              },
              {
                to: address,
                value: "0x0",
                data: "0x",
              },
            ],
          },
        ],
      });

      return result;
    } catch (error: any) {
      return { error: error?.message || error };
    }
  }

  /**
   * Get the status of a batch of calls using EIP-5792 `wallet_getCallsStatus`.
   * @param batchId - The batch ID returned from `wallet_sendCalls`.
   */
  async getCallsStatus(batchId: string): Promise<any> {
    try {
      const result = await this.provider.request({
        method: "wallet_getCallsStatus",
        params: [batchId],
      });

      return result;
    } catch (error: any) {
      return { error: error?.message || error };
    }
  }
}
