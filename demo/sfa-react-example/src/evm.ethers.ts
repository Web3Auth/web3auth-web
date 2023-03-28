import type {SafeEventEmitterProvider} from '@web3auth/base'
import {ethers} from 'ethers'

export default class EthereumRpc {
  private provider: SafeEventEmitterProvider

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider
  }

  async getAccounts(): Promise<string> {
    try {
      const provider = new ethers.providers.Web3Provider(this.provider as any)
      const signer = provider.getSigner()
      const account = await signer.getAddress()
      return account
    } catch (error: unknown) {
      return error as string
    }
  }

  async getBalance(): Promise<string> {
    try {
      const provider = new ethers.providers.Web3Provider(this.provider as any)
      const signer = provider.getSigner()
      const account = await signer.getAddress()
      // Get user's balance in ether
      const balance = ethers.utils.formatEther(
        await provider.getBalance(account), // Balance is in wei
      )
      return balance
    } catch (error) {
      return error as string
    }
  }

  async signMessage(): Promise<string> {
    try {
      const provider = new ethers.providers.Web3Provider(this.provider as any)
      const signer = provider.getSigner()

      const originalMessage = 'YOUR_MESSAGE'

      const signedMessage = await signer.signMessage(originalMessage)
      return signedMessage
    } catch (error) {
      return error as string
    }
  }

  async signAndSendTransaction(): Promise<string> {
    try {
      const provider = new ethers.providers.Web3Provider(this.provider as any)
      const signer = provider.getSigner()
      const address = await signer.getAddress()

      const tx = await signer.sendTransaction({
        to: address,
        value: ethers.utils.parseEther('0.0001'),
      })
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      return error as string
    }
  }
}
