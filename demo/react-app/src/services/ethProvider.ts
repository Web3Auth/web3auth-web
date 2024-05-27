import { IProvider } from "@web3auth/base";
import Web3 from "web3";
import { IWalletProvider } from "./walletProvider";
import { erc20Abi, storageSCAbi } from "../config/abi";

const ethProvider = (provider: IProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {

  const getTokenAddress =  () => {
      switch (provider.chainId) {
        case "0x1":
        case "0x89":
          return "0x655F2166b0709cd575202630952D71E2bB0d61Af";  
        case "0x13882": // amoy
          return "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904"
        case "0xaa36a7": // sepolia
          return "0x779877A7B0D9E8603169DdbD7836e478b4624789";
        case "0x66eee": // arbitrum
          return "0x3a12ea1bEa9b04f5541affBe1F6Dd83a72a9bbd7";
        default:
          return "";
      }
  }

  const getStorageAddress = () => {
    // simple default storage smart contract from remix.ethereum.org
      switch (provider.chainId) {
        case "0x1":
        case "0x89": 
          return "";  
        case "0x13882": // amoy
        case "0xaa36a7": // sepolia
        case "0x66eee": // arbitrum
          return "0xAD2709105e2b755b29DA45859d4E42A69cfADa12";
        default:
          return "";
      }
  }

  const getAccounts = async () => {
    try {
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      uiConsole("Eth accounts", accounts);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getBalance = async () => {
    try {
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      const balance = await web3.eth.getBalance(accounts[0]);
      uiConsole("Eth balance", balance);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getTokenBalance = async () => {
    try {
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      const tokenAddress = getTokenAddress();
      if (tokenAddress !== "") {
        const contract = new web3.eth.Contract(JSON.parse(JSON.stringify(erc20Abi)), tokenAddress);
        const balance = await contract.methods.balanceOf(accounts[0]).call();
        uiConsole("Token balance", balance);
      } else uiConsole("No Token Address for this blockchain");
      
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signMessage = async () => {
    try {
      const web3 = new Web3(provider);
      const message = "Some string";
      const hash = web3.utils.sha3(message) as string;
      const fromAddress = (await web3.eth.getAccounts())[1];
      const sig = await web3.eth.personal.sign(hash, fromAddress, "");
      uiConsole("personal sign", sig);
      uiConsole("Eth sign message => true", sig);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signAndSendTransaction = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      const gasestimate = await web3.eth.estimateGas({ from: accounts[0], to: accounts[0], value: web3.utils.toWei("0", "ether") });
      // console.log("gasestimate", gasestimate);
      const txRes = await web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[0],
        value: web3.utils.toWei("0", "ether"),
        gas: gasestimate,
      });
      uiConsole("txRes", txRes);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signAndSendTokenTransaction = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      const contract = new web3.eth.Contract(erc20Abi, getTokenAddress());
      const txRes = await contract.methods
        .transfer("0x3E2a1F4f6b6b5d281Ee9a9B36Bb33F7FBf0614C3", web3.utils.toWei("0", "ether"))
        .send({ from: accounts[0] });
      uiConsole("txRes", txRes);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const randomContractInteraction = async () => {
    try {
      const web3 = new Web3(provider as any);
      // get address for the storage smart contract for actual chain
      let storageAddress = getStorageAddress();

      if (storageAddress !== "") {
        const contract = new web3.eth.Contract(storageSCAbi, storageAddress);
        const txRes = await contract.methods.store(Math.floor(Math.random() * 10));
        uiConsole("txRes", txRes);  
      } else uiConsole("No Smart Contract for this blockchain.");
      
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signTransaction = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      // only supported with social logins (openlogin adapter)
      const txRes = await web3.eth.signTransaction({
        from: accounts[1],
        to: accounts[1],
        value: web3.utils.toWei("0.001", "ether"),
      });
      uiConsole("txRes", txRes);
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };
  return {
    getAccounts,
    getBalance,
    signMessage,
    signAndSendTransaction,
    signTransaction,
    getTokenBalance,
    signAndSendTokenTransaction,
    randomContractInteraction,
  };
};

export default ethProvider;
