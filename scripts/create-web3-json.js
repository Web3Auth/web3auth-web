/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs").promises;

async function mergeJsonFiles(file1Path, file2Path, outputPath) {
  try {
    // Read both JSON files asynchronously
    const [data1, data2] = await Promise.all([fs.readFile(file1Path, "utf8"), fs.readFile(file2Path, "utf8")]);

    // Parse JSON data
    const json1 = JSON.parse(data1);
    const json2 = JSON.parse(data2);

    // const obj1 = Object.keys(json1.groups);

    const walletKeys = Object.keys(json2);

    walletKeys.forEach((wallet) => {
      const walletData =
        json1.groups?.[wallet] || json1.groups?.[`${wallet}wallet`] || json1.wallets?.[wallet] || json1.wallets?.[`${wallet}wallet`] || null;

      // if (wallet === "aktionariat") {
      //   console.log(walletData, "HELLO");
      // }

      if (walletData) {
        json2[wallet].primaryColor = walletData?.brand?.primaryColor || "#000000";
      } else {
        json2[wallet].primaryColor = "#000000";
      }
    });

    // const updatedJSON = { ...json2 };

    // const finalJSON = {};

    // const updatedJSONKeys = Object.keys(updatedJSON);
    // updatedJSONKeys.forEach((a) => {
    //   if (obj1.includes(a)) {
    //     finalJSON.default = { ...finalJSON.default, [a]: updatedJSON[a] };
    //   } else {
    //     finalJSON.others = { ...finalJSON.others, [a]: updatedJSON[a] };
    //   }
    // });

    // Write the merged JSON to a new file
    await fs.writeFile(outputPath, JSON.stringify(json2, null, 2));
    console.log(`Merged JSON has been written to ${outputPath}`);
  } catch (error) {
    console.error("Error merging JSON files:", error);
  }
}

// Call the function to merge JSON files
mergeJsonFiles("./wallet-registry-web3auth-old.json", "wallet-registry-web3auth.json");
