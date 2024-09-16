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

  target.imgExtension = source.image_id ? "webp" : "svg";

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
const registryMap = new Map(walletRegistry.data.map((wallet) => [wallet.name.toLowerCase(), wallet]));
const othersMap = Object.keys(mergedUpdated.others);
const defaultMap = Object.keys(mergedUpdated.default);

// Function to merge data for a category
function mergeCategoryData(category) {
  for (const walletName in category) {
    const registryWallet = registryMap.get(walletName.toLowerCase());
    if (registryWallet) {
      mergeWalletData(category[walletName], registryWallet);
    }
  }
}

// Merge data for 'default' and 'others' categories
mergeCategoryData(mergedUpdated.default);
mergeCategoryData(mergedUpdated.others);

// Function to convert registry wallet to merged updated format
function convertToMergedFormat(registryWallet) {
  return {
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
    imgExtension: registryWallet?.image_id ? "webp" : "svg",
  };
}

for (const [_, wallet] of registryMap) {
  // uniswap-wallet
  const walletKey = wallet.name.toLowerCase().replace(/\| /g, "").replace(/ /g, "-");
  const suffixRemoveKey = walletKey.replace("-wallet", "");
  const normalNotExist = !othersMap.includes(walletKey) && !defaultMap.includes(walletKey);
  const suffixRemoveNotExist = !othersMap.includes(suffixRemoveKey) && !defaultMap.includes(suffixRemoveKey);
  const NotExist = normalNotExist || suffixRemoveNotExist;
  // if (["uniswap", "uniswap-wallet"].includes(walletKey)) {
  //   console.log(normalNotExist, suffixRemoveNotExist, walletKey, suffixRemoveKey);
  // }
  if (NotExist) mergedUpdated.others[!suffixRemoveNotExist ? suffixRemoveKey : walletKey] = convertToMergedFormat(wallet);
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
  "t+",
  "torus",
  "web3auth",
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
  }
}
addImgExt(mergedUpdated.default);
addImgExt(mergedUpdated.others);

fs.writeFileSync("wallet-registry-updated.json", JSON.stringify(mergedUpdated, null, 2));
// Write the updated data back to the file
console.log("Merge completed successfully.");
