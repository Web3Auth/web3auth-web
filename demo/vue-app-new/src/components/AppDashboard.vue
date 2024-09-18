<script setup lang="ts">
import { METHOD_TYPES } from "@toruslabs/ethereum-controllers";
import { Button, Card } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, WALLET_PLUGINS } from "@web3auth/base";
import { useWeb3Auth } from "@web3auth/modal-vue-composables";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { recoverAddress, TypedDataEncoder, verifyMessage } from "ethers";
import { useI18n } from "vue-i18n";

import { getV4TypedData } from "../config";
import { getAccounts, getBalance, getChainId, sendEth, signEthMessage, signTransaction } from "../services/ethHandlers";
import { signAllTransactions, signAndSendTransaction, signMessage } from "../services/solHandlers";
import { formDataStore } from "../store/form";

const { t } = useI18n({ useScope: "global" });
const { log } = console;

const formData = formDataStore;

const { userInfo, isConnected, provider, switchChain, addAndSwitchChain, web3Auth } = useWeb3Auth();

const isDisplay = (name: string): boolean => {
  switch (name) {
    case "dashboard":
      return isConnected.value;

    case "ethServices":
      return formData.chainNamespace === CHAIN_NAMESPACES.EIP155;

    case "solServices":
      return formData.chainNamespace === CHAIN_NAMESPACES.SOLANA;

    case "walletServices":
      return (
        formData.chainNamespace === CHAIN_NAMESPACES.EIP155 &&
        formData.walletPlugin.enable &&
        web3Auth.value?.connectedAdapterName === WALLET_ADAPTERS.AUTH
      );

    default: {
      return false;
    }
  }
};

const showWalletUI = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletPlugin.showWalletUi();
};
const showCheckout = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletPlugin.showCheckout();
};
const showWalletConnectScanner = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletPlugin.showWalletConnectScanner();
};

const clearConsole = () => {
  const el = document.querySelector("#console>pre");
  const h1 = document.querySelector("#console>h1");
  const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
  if (h1) {
    h1.innerHTML = "";
  }
  if (el) {
    el.innerHTML = "";
  }
  if (consoleBtn) {
    consoleBtn.style.display = "none";
  }
};

const printToConsole = (...args: unknown[]) => {
  const el = document.querySelector("#console>pre");
  const h1 = document.querySelector("#console>h1");
  const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
  if (h1) {
    h1.innerHTML = args[0] as string;
  }
  if (el) {
    el.innerHTML = JSON.stringify(args[1] || {}, null, 2);
  }
  if (consoleBtn) {
    consoleBtn.style.display = "block";
  }
};

const onGetUserInfo = async () => {
  printToConsole("User Info", userInfo.value);
};

const onSendEth = async () => {
  await sendEth(provider.value as IProvider, printToConsole);
};

const onSignEthMessage = async () => {
  await signEthMessage(provider.value as IProvider, printToConsole);
};

const onGetAccounts = async () => {
  await getAccounts(provider.value as IProvider, printToConsole);
};

const getConnectedChainId = async () => {
  await getChainId(provider.value as IProvider, printToConsole);
};

const onGetBalance = async () => {
  await getBalance(provider.value as IProvider, printToConsole);
};

const onSwitchChain = async () => {
  log("switching chain");
  try {
    await switchChain({ chainId: "0x89" });
    printToConsole("switchedChain");
  } catch (error) {
    printToConsole("switchedChain error", error);
  }
};

const onAddChain = async () => {
  try {
    await addAndSwitchChain({
      chainId: "0xaa36a7",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      rpcTarget: "https://1rpc.io/sepolia	",
      blockExplorerUrl: "https://sepolia.etherscan.io",
      displayName: "Sepolia",
      ticker: "ETH",
      tickerName: "Ethereum",
    });
    printToConsole("added chain");
  } catch (error) {
    printToConsole("add chain error", error);
  }
};

const onSignAndSendTransaction = async () => {
  await signAndSendTransaction(provider.value as IProvider, printToConsole);
};

const onSignTransaction = async () => {
  await signTransaction(provider.value as IProvider, printToConsole);
};

const onSignMessage = async () => {
  await signMessage(provider.value as IProvider, printToConsole);
};

const onSignAllTransactions = async () => {
  await signAllTransactions(provider.value as IProvider, printToConsole);
};

const onSignTypedData_v4 = async () => {
  try {
    printToConsole("Initiating sign typed data v4");

    const chain = await getChainId(provider.value as IProvider, () => {});
    const accounts = await getAccounts(provider.value as IProvider, () => {});
    const typedData = getV4TypedData(chain as string);
    let signTypedDataV4VerifyResult = "";
    // const signedMessage = await ethersProvider?.send("eth_signTypedData_v4", [account.value, JSON.stringify(typedData)]);

    const from = accounts?.[0];

    const signedMessage = (await provider.value?.request({
      method: METHOD_TYPES.ETH_SIGN_TYPED_DATA_V4,
      params: [from, JSON.stringify(typedData)],
    })) as string;

    const msg = TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message);
    const recoveredAddr = recoverAddress(msg, signedMessage);
    if (recoveredAddr.toLowerCase() === from?.toLowerCase()) {
      log(`Successfully verified signer as ${recoveredAddr}`);
      signTypedDataV4VerifyResult = recoveredAddr;
    } else {
      throw new Error(`Failed to verify signer when comparing ${recoveredAddr} to ${from}`);
    }
    printToConsole(`Success`, { signedMessage, verify: signTypedDataV4VerifyResult });
  } catch (error) {
    log(error);
    printToConsole("Failed", (error as Error).message);
  }
};

const onSignPersonalMsg = async () => {
  try {
    printToConsole("Initiating personal sign");
    const message = "Example `personal_sign` messages";
    const accounts = await getAccounts(provider.value as IProvider, () => {});
    const from = accounts?.[0];
    let personalSignVerifySigUtilResult = "";
    // const signedMessage = await ethersProvider?.send("personal_sign", [message, account.value]);
    const msg = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    const signedMessage = (await provider.value?.request({
      method: METHOD_TYPES.PERSONAL_SIGN,
      params: [msg, from, "Example password"],
    })) as string;

    // Verify
    const recoveredAddr = verifyMessage(message, signedMessage);

    if (recoveredAddr.toLowerCase() === from?.toLowerCase()) {
      log(`SigUtil Successfully verified signer as ${recoveredAddr}`);
      personalSignVerifySigUtilResult = recoveredAddr;
    } else {
      throw new Error(`SigUtil Failed to verify signer when comparing ${recoveredAddr} to ${from}`);
    }

    printToConsole(`Success`, { signedMessage, verify: personalSignVerifySigUtilResult });
  } catch (error) {
    log(error);
    printToConsole("Failed", (error as Error).message);
  }
};
</script>

<template>
  <div v-if="isDisplay('dashboard')" class="grid gap-0">
    <div class="grid grid-cols-8 gap-0">
      <div class="col-span-1"></div>
      <Card class="px-4 py-4 gird col-span-2">
        <div class="mb-2">
          <Button block size="xs" pill variant="secondary" data-testid="btnClearConsole" @click="clearConsole">
            {{ $t("app.buttons.btnClearConsole") }}
          </Button>
        </div>
        <div class="mb-2">
          <Button block size="xs" pill @click="onGetUserInfo">
            {{ $t("app.buttons.btnGetUserInfo") }}
          </Button>
        </div>
        <Card v-if="isDisplay('walletServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
          <div class="text-xl font-bold leading-tight text-left mb-2">Wallet Service</div>
          <Button block size="xs" pill class="mb-2" @click="showWalletUI">
            {{ $t("app.buttons.btnShowWalletUI") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="showWalletConnectScanner">
            {{ $t("app.buttons.btnShowWalletConnectScanner") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="showCheckout">
            {{ $t("app.buttons.btnShowCheckout") }}
          </Button>
        </Card>
        <Card v-if="isDisplay('ethServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
          <div class="text-xl font-bold leading-tight text-left mb-2">Sample Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onGetAccounts">
            {{ t("app.buttons.btnGetAccounts") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetBalance">
            {{ t("app.buttons.btnGetBalance") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSendEth">{{ t("app.buttons.btnSendEth") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignEthMessage">{{ t("app.buttons.btnSignEthMessage") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="getConnectedChainId">
            {{ t("app.buttons.btnGetConnectedChainId") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignTypedData_v4">
            {{ t("app.buttons.btnSignTypedData_v4") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignPersonalMsg">
            {{ t("app.buttons.btnSignPersonalMsg") }}
          </Button>
        </Card>
        <Card v-if="isDisplay('solServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
          <div class="text-xl font-bold leading-tight text-left mb-2">Sample Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onAddChain">{{ t("app.buttons.btnAddChain") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAndSendTransaction">
            {{ t("app.buttons.btnSignAndSendTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignTransaction">
            {{ t("app.buttons.btnSignTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignMessage">{{ t("app.buttons.btnSignMessage") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAllTransactions">
            {{ t("app.buttons.btnSignAllTransactions") }}
          </Button>
        </Card>
      </Card>
      <Card id="console" class="px-4 py-4 col-span-4 overflow-y-auto">
        <pre class="whitespace-pre-line overflow-x-auto font-normal text-base leading-6 text-black break-words overflow-y-auto max-h-screen"></pre>
      </Card>
    </div>
  </div>
</template>
