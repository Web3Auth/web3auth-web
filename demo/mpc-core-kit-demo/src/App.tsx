/* eslint-disable no-throw-literal */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable require-atomic-updates */
/* eslint-disable @typescript-eslint/no-shadow */
import BN from "bn.js";
import { useEffect, useState } from "react";
import { Web3AuthMPCCoreKit } from "@web3auth/mpc-core-kit"
import Web3 from 'web3';
import type { provider } from "web3-core";
// import swal from "sweetalert";

import "./App.css";
import { generateIdToken } from "./utils";
import { SafeEventEmitterProvider } from "@web3auth/base";

const uiConsole = (...args: any[]): void => {
  const el = document.querySelector("#console>p");
  if (el) {
    el.innerHTML = JSON.stringify(args || {}, null, 2);
  }
  console.log(...args);
};


function App() {
  const [loginResponse, setLoginResponse] = useState<any>(null);
  const [coreKitInstance, setCoreKitInstance] = useState<Web3AuthMPCCoreKit | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [web3, setWeb3] = useState<any>(null)
  const [mockVerifierId, setMockVerifierId] = useState<string | null>(null);
  const [showBackupPhraseScreen, setShowBackupPhraseScreen] = useState<boolean>(false);
  const [seedPhrase, setSeedPhrase] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (!mockVerifierId) return;
    localStorage.setItem(`mockVerifierId`, mockVerifierId);
  }, [mockVerifierId]);

  useEffect(() => {
    let verifierId: string;

    const localMockVerifierId = localStorage.getItem("mockVerifierId");
    if (localMockVerifierId) verifierId = localMockVerifierId;
    else verifierId = Math.round(Math.random() * 100000) + "@example.com";
    setMockVerifierId(verifierId);

  }, []);

  useEffect(() => {
    const init = async () => {
      const coreKitInstance = new Web3AuthMPCCoreKit({ web3AuthClientId: 'torus-key-test', web3AuthNetwork: 'testnet'  })
      await coreKitInstance.init();
      setCoreKitInstance(coreKitInstance);
      if (coreKitInstance.provider) setProvider(coreKitInstance.provider);
    }
    init()
  }, [])

  useEffect(() => {
    if(provider) {
      const web3 = new Web3(provider as provider);
      setWeb3(web3);
    }
  }, [provider])

  const keyDetails = async () => {
    if (!coreKitInstance) {
      throw new Error('coreKitInstance not found');
    }
    uiConsole(coreKitInstance.getKeyDetails())
  };

  const login = async (mockLogin: boolean) => {
    try {
      if (!coreKitInstance) {
        throw new Error('initiated to login');
      }
      const token = generateIdToken(mockVerifierId as string, "ES256");
      const provider = await coreKitInstance.connect({ subVerifierDetails: { 
        verifier: "torus-test-health",
        typeOfLogin: 'jwt',
        clientId: "torus-key-test",
        jwtParams: {
          verifierIdField: "email",
          id_token: token
        }
      }})

      if (provider) setProvider(provider)
    } catch (error: unknown) {
      console.log(error);
      if ((error as Error).message === "required more shares") {
        setShowBackupPhraseScreen(true);
      }
    }
  }

  const logout = async () => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance not found");
    }
    await coreKitInstance.logout();
    uiConsole("Log out");
    setProvider(null);
    setLoginResponse(null);
  };

  const getUserInfo = (): void => {
    const user = coreKitInstance?.getUserInfo();
    uiConsole(user);
  };

  const getLoginResponse = (): void => {
    uiConsole(loginResponse);
  };

  const exportShare = async (): Promise<void> => { 
    if (!provider) {
      throw new Error('provider is not set.');
    }
    const share = await coreKitInstance?.exportBackupShare();
    console.log(share);
    uiConsole(share);
  }

  const submitBackupShare = async (): Promise<void> => { 
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    await coreKitInstance.inputBackupShare(seedPhrase);
    uiConsole('submitted');
    if (coreKitInstance.provider) setProvider(coreKitInstance.provider);
  }

  const savePasswordShare = async () => {
    try {
      if (!coreKitInstance) { 
        throw new Error("coreKitInstance is not set");
      }
      await coreKitInstance.addSecurityQuestionShare("What is your password?", password);
      uiConsole('saved');
    } catch (err) {
      uiConsole(err);
    }
  }

  const updatePasswordShare = async () => {
    try {
      if (!coreKitInstance) { 
        throw new Error("coreKitInstance is not set");
      }
      await coreKitInstance.changeSecurityQuestionShare("What is your password?", password);
      uiConsole('updated');
    } catch (err) {
      uiConsole(err);
    }
  }

  const deletePasswordShare = async () => {
    try {
      if (!coreKitInstance) { 
        throw new Error("coreKitInstance is not set");
      }
      await coreKitInstance.deleteSecurityQuestionShare("What is your password?");
      uiConsole('deleted');
    } catch (err) {
      uiConsole(err);
    }
  }

  const resetViaPassword = async () => {
    if (!coreKitInstance) { 
      throw new Error("coreKitInstance is not set");
    }
    await coreKitInstance.recoverSecurityQuestionShare("What is your password?", password);
    uiConsole('submitted');
    if (coreKitInstance.provider) setProvider(coreKitInstance.provider);
  }
  

  // const getMetadataKey = (): void => {
  //   uiConsole(metadataKey);
  //   return metadataKey;
  // };

  // const resetAccount = async () => {
  //   try {
  //     localStorage.removeItem(`tKeyLocalStore\u001c${loginResponse.userInfo.verifier}\u001c${loginResponse.userInfo.verifierId}`);
  //     await tKey.storageLayer.setMetadata({
  //       privKey: oAuthShare,
  //       input: { message: "KEY_NOT_FOUND" },
  //     });
  //     uiConsole("Reset Account Successful.");
  //   } catch (e) {
  //     uiConsole(e);
  //   }
  // };

  const getChainID = async () => {
    if (!web3) {
      console.log("web3 not initialized yet");
      return;
    }
    const chainId = await web3.eth.getChainId();
    uiConsole(chainId);
    return chainId;
  };

  const getAccounts = async () => {
    if (!web3) {
      console.log("web3 not initialized yet");
      return;
    }
    const address = (await web3.eth.getAccounts())[0];
    uiConsole(address);
    return address;
  };

  const getBalance = async () => {
    if (!web3) {
      console.log("web3 not initialized yet");
      return;
    }
    const address = (await web3.eth.getAccounts())[0];
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address) // Balance is in wei
    );
    uiConsole(balance);
    return balance;
  };

  const signMessage = async (): Promise<any> => {
    if (!web3) {
      console.log("web3 not initialized yet");
      return;
    }
    const fromAddress = (await web3.eth.getAccounts())[0];
    const originalMessage = [
      {
        type: "string",
        name: "fullName",
        value: "Satoshi Nakamoto",
      },
      {
        type: "uint32",
        name: "userId",
        value: "1212",
      },
    ];
    const params = [originalMessage, fromAddress];
    const method = "eth_signTypedData";
    const signedMessage = await (web3.currentProvider as any)?.sendAsync({
      id: 1,
      method,
      params,
      fromAddress,
    });
    uiConsole(signedMessage);
  };

  const sendTransaction = async () => {
    if (!web3) {
      console.log("web3 not initialized yet");
      return;
    }
    const fromAddress = (await web3.eth.getAccounts())[0];

    const destination = "0x2E464670992574A613f10F7682D5057fB507Cc21";
    const amount = web3.utils.toWei("0.0001"); // Convert 1 ether to wei

    // Submit transaction to the blockchain and wait for it to be mined
    uiConsole("Sending transaction...");
    const receipt = await web3.eth.sendTransaction({
      from: fromAddress,
      to: destination,
      value: amount,
    });
    uiConsole(receipt);
  };

  const loggedInView = (
    <>
      <h2 className="subtitle">Account Details</h2>
      <div className="flex-container">

        <button onClick={getUserInfo} className="card">
          Get User Info
        </button>


        <button onClick={getLoginResponse} className="card">
          See Login Response
        </button>


        <button onClick={keyDetails} className="card">
          Key Details
        </button>


        {/* <button onClick={getMetadataKey} className="card">
          Metadata Key
        </button> */}


        <button onClick={logout} className="card">
          Log Out
        </button>

      </div>
      <h2 className="subtitle">Recovery/ Key Manipulation</h2>
      <div className="flex-container">

        <button onClick={exportShare} className="card">
          Export backup share
        </button>

        <input value={password} onChange={(e) => setPassword(e.target.value)}></input>
        <button onClick={savePasswordShare} className="card">
          Save Password Share
        </button>


        <input value={password} onChange={(e) => setPassword(e.target.value)}></input>
        <button onClick={updatePasswordShare} className="card">
          Update Password Share
        </button>

        <button onClick={deletePasswordShare} className="card">
          Delete Password Share
        </button>


        {/* <button onClick={createNewTSSShareIntoManualBackupFactorkey} className="card">
          Create New TSSShare Into Manual Backup Factor
        </button>


        <button onClick={deleteTkeyLocalStore} className="card">
          Delete tKey Local Store (enables Recovery Flow)
        </button>


        <button onClick={resetAccount} className='card'>
          Reset Account (CAUTION)
        </button> */}

      </div>
      <h2 className="subtitle">Blockchain Calls</h2>
      <div className="flex-container">

        <button onClick={getChainID} className="card">
          Get Chain ID
        </button>


        <button onClick={getAccounts} className="card">
          Get Accounts
        </button>


        <button onClick={getBalance} className="card">
          Get Balance
        </button>



        <button onClick={signMessage} className="card">
          Sign Message
        </button>


        <button onClick={sendTransaction} className="card">
          Send Transaction
        </button>

      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <>
    {
      !showBackupPhraseScreen && (
        <>
          <button onClick={() => login(false)} className="card">
            Login
          </button>
          <button onClick={() => login(true)} className="card">
            MockLogin
          </button>
        </>
      )
    }

      <p>Mock Login Seed Email</p>
      <input value={mockVerifierId as string} onChange={(e) => setMockVerifierId(e.target.value)}></input>

      {
        showBackupPhraseScreen && ( 
          <>
            <textarea value={seedPhrase as string} onChange={(e) => setSeedPhrase(e.target.value)}></textarea>
            <button onClick={submitBackupShare} className="card">
              Submit backup share
            </button>
            <hr />
            OR
            <hr/>
            <input value={password} onChange={(e) => setPassword(e.target.value)}></input>
            <button onClick={resetViaPassword} className="card">
              Reset using password Share
            </button>
          </>
        )
      }
    </>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/guides/mpc" rel="noreferrer">
          Web3Auth Core Kit tKey MPC Beta
        </a> {" "}
        & ReactJS Ethereum Example
      </h1>

      <div className="grid">{provider ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/tkey/tkey-mpc-beta-react-popup-example" target="_blank" rel="noopener noreferrer">
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
