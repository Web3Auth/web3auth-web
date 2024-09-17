/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const fs = require("fs");

// Read the input files
const walletRegistry = JSON.parse(fs.readFileSync("./wallet-registry-wc.json", "utf8"));
const mergedUpdated = JSON.parse(fs.readFileSync("./wallet-registry-web3auth-new.json", "utf8"));

console.log(walletRegistry.count);

// Function to merge data for a single wallet
function mergeWalletData(target, source) {
  if (source.injected) {
    target.injected = source.injected;
  } else {
    target.injected = null;
  }

  // console.log(target.name);

  if (target.name === "bitfrost") {
    target.imgExtension = "svg";
  } else {
    target.imgExtension = source.image_id ? "webp" : "svg";
  }

  // if (source.image_id) {
  //   target.image_id = source.image_id;
  // } else {
  //   target.image_id = null;
  // }

  if (source.chains) {
    if (!target.chains) {
      target.chains = [];
    }
    // Merge chains, avoiding duplicates
    source.chains.forEach((chain) => {
      if (!target.chains.includes(chain)) {
        target.chains.push(chain);
      }
    });
  }
}

// Create a map of wallet names to their data in the registry
const registryMap = new Map(walletRegistry.data.map((wallet) => [wallet.name.toLowerCase().trim().replace(/ /g, "-"), wallet]));
const othersMap = Object.keys(mergedUpdated.others);
const defaultMap = Object.keys(mergedUpdated.default);

// Function to merge data for a category
function mergeCategoryData(category) {
  for (const walletName in category) {
    const withWalletSuffix = `${walletName.toLowerCase()}-wallet`;
    const withNoHiphenSpace = `${walletName.toLowerCase()}wallet`;
    const removingDot = `${walletName.toLowerCase()}.wallet`;
    const includeKeys = new Map([["bonuz-social-id", "bonuz-social-smart-wallet"]]);
    const registryWallet =
      registryMap.get(walletName.toLowerCase()) ||
      registryMap.get(withWalletSuffix) ||
      registryMap.get(withNoHiphenSpace) ||
      registryMap.get(removingDot) ||
      (includeKeys.has(walletName.toLowerCase()) && registryMap.get(includeKeys.get(walletName.toLowerCase())));
    if (walletName === "3s") {
      console.log(walletName, registryWallet, "MERGE");
    }
    if (registryWallet) {
      mergeWalletData(category[walletName], registryWallet);
    }
  }
}

// Merge data for 'default' and 'others' categories
mergeCategoryData(mergedUpdated.default);
mergeCategoryData(mergedUpdated.others);

// Function to convert registry wallet to merged updated format
function convertToMergedFormat(registryWallet, otherWallet) {
  if (["uniswap", "Uniswap Wallet"].includes(registryWallet.name)) {
    console.log(registryWallet.name, "CALLED", otherWallet);
  }

  const obj = {
    name: registryWallet.name,
    chains: registryWallet.chains || [],
    app: {
      browser: registryWallet.chrome_store || null,
      ios: registryWallet.app_store || null,
      android: registryWallet.play_store || null,
    },
    mobile: {
      native: registryWallet.mobile_link || null,
      universal: registryWallet.link_mode || null,
    },
    desktop: {
      native: registryWallet.desktop_link || null,
      universal: registryWallet.webapp_link || null,
    },
    injected: registryWallet.injected || null,
    primaryColor: "#00000",
    // image_id: registryWallet?.image_id || null,
    imgExtension: registryWallet?.image_id ? "webp" : "svg",
  };

  if (otherWallet?.walletConnect) {
    obj.walletConnect = otherWallet?.walletConnect;
  }

  if (otherWallet?.primaryColor) {
    obj.primaryColor = otherWallet?.primaryColor;
  }

  return obj;
}

for (const [_, wallet] of registryMap) {
  // uniswap-wallet
  const walletKey = wallet.name.toLowerCase().replace(/\| /g, "").replace(/ /g, "-");
  const suffixRemoveKey = walletKey.replace("-wallet", "");
  const normalNotExist = !othersMap.includes(walletKey) && !defaultMap.includes(walletKey);
  const suffixRemoveNotExist = !othersMap.includes(suffixRemoveKey) && !defaultMap.includes(suffixRemoveKey);
  const NotExist = normalNotExist || suffixRemoveNotExist;
  if (["uniswap", "uniswap-wallet"].includes(walletKey)) {
    console.log(normalNotExist, suffixRemoveNotExist, walletKey, suffixRemoveKey, NotExist);
  }
  if (NotExist)
    mergedUpdated.others[!suffixRemoveNotExist ? suffixRemoveKey : walletKey] = convertToMergedFormat(
      wallet,
      mergedUpdated.others[!suffixRemoveNotExist ? suffixRemoveKey : walletKey]
    );
}

const removeKeys = [
  "ape",
  "bitwinex",
  "campux.digital",
  "concordium",
  "deficloud",
  "dmtoken",
  "ds-security-sa",
  "eth-q1",
  "gateweb3",
  "levain",
  "linen",
  "meta",
  "mg",
  "multix",
  "neon",
  "nufi",
  "numo",
  "opto",
  "ottr-finance",
  "piethereum-hardware",
  "puzzle",
  "rss",
  "sistemas",
  "smart.baby",
  "smartrush",
  "solace",
  "trust-asset",
  "ultimate",
  "uniblow",
  "talk+",
  "torus",
  "web3auth",
  "crypto.com",
  "mpcvault",
  "tokoin",
  "volt:-defi",
  "cogni-",
  "amaze",
  "at",
  "block",
  "bonuz-social-id",
  "cool",
  "cyber",
  "did",
  "face",
  "fox",
  "fxwallet",
  "gatewallet",
  "imota",
  "islami",
  "kraken",
  "math",
  "ozone",
  "plt",
  "pools",
  "rice",
  "scramberry",
  "sub",
  "super",
  "t+",
  "thor",
  "tidus",
  "wemix",
  "x9",
];

const removeJSONKeys = () => {
  for (const keys of removeKeys) {
    if (mergedUpdated.others[keys]) {
      delete mergedUpdated.others[keys];
    }
  }
};

removeJSONKeys();

function addImgExt(data) {
  for (const [keys, value] of Object.entries(data)) {
    if (!data[keys].imgExtension) {
      data[keys].imgExtension = "svg";
    }
    // if (!data[keys].image_id) {
    //   data[keys].image_id = null;
    // }
  }
}
addImgExt(mergedUpdated.default);
addImgExt(mergedUpdated.others);

fs.writeFileSync("wallet-registry-updated.json", JSON.stringify(mergedUpdated, null, 2));
// Write the updated data back to the file
console.log("Merge completed successfully.");
