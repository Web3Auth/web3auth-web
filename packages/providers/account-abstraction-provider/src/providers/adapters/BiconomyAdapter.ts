import { SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";
import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07, providerToSmartAccountSigner } from "permissionless";
import { signerToBiconomySmartAccount } from "permissionless/accounts";
import { createPimlicoBundlerClient, PimlicoBundlerClient } from "permissionless/clients/pimlico";
import { EntryPoint } from "permissionless/types";
import { Address, Chain, Client, createPublicClient, EIP1193Provider, http } from "viem";

import { AaTransaction, IAaAdapter } from "./types";

const apiKey = "3027848b-7365-4081-b66e-1c7cb69b5b78";
const bundlerUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;
// const bundlerUrl = `https://bundler.biconomy.io/api/v2/0xaa36a7/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`;

export default class BiconomyAdapter implements IAaAdapter {
  private eoaAddress: Address;

  private rpcTarget: string;

  private chainId: string;

  private provider: SafeEventEmitterProvider;

  private bundlerClient: PimlicoBundlerClient<EntryPoint>;

  constructor({
    eoaAddress,
    rpcTarget,
    chainId,
    provider,
  }: {
    eoaAddress: string;
    rpcTarget: string;
    chainId: string;
    provider: SafeEventEmitterProvider;
  }) {
    this.eoaAddress = eoaAddress as Address;
    this.rpcTarget = rpcTarget;
    this.chainId = chainId;
    this.provider = provider;

    // Set Bundler
    const bundlerClient = createPimlicoBundlerClient({
      transport: http(bundlerUrl),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    this.bundlerClient = bundlerClient as PimlicoBundlerClient<EntryPoint>;
  }

  async getSmartAccountAddress(): Promise<string> {
    const smartAccount = await this.getSmartAccount();
    return smartAccount.address;
  }

  async sendTransaction(txData: AaTransaction): Promise<string> {
    const smartAccountClient = await this.getSmartAccountClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txHash = await smartAccountClient.sendTransaction(txData as any);

    return txHash;
  }

  private async getSmartAccount() {
    const publicClient = createPublicClient({
      transport: http(this.rpcTarget), // custom(this.provider)
      chain: this.chainId as unknown as Chain,
    });

    const smartAccountSigner = await providerToSmartAccountSigner(this.provider as EIP1193Provider, {
      signerAddress: this.eoaAddress,
    });

    return signerToBiconomySmartAccount(publicClient as Client, {
      signer: smartAccountSigner,
      entryPoint: ENTRYPOINT_ADDRESS_V06,
    });
  }

  private async getSmartAccountClient() {
    const account = await this.getSmartAccount();
    const smartAccount = createSmartAccountClient({
      account,
      chain: this.chainId as unknown as Chain,
      bundlerTransport: http(bundlerUrl),
      middleware: {
        gasPrice: async () => {
          return (await this.bundlerClient.getUserOperationGasPrice()).fast;
        },
        // sponsorUserOperation: paymasterClient.sponsorUserOperation,
      },
    });
    return smartAccount;
  }
}
