/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs").promises;

// Function to merge two JSON objects
// function mergeJsonObjects(json1, json2) {
//   // Custom merging logic: combining objects and giving priority to `json2` in case of conflict
//   return { ...json1, ...json2 };
// }

async function mergeJsonFiles(file1Path, file2Path, outputPath) {
  try {
    // Read both JSON files asynchronously
    const [data1, data2] = await Promise.all([fs.readFile(file1Path, "utf8"), fs.readFile(file2Path, "utf8")]);

    // Parse JSON data
    const json1 = JSON.parse(data1);
    const json2 = JSON.parse(data2);

    console.log(json1, "JSON1");
    console.log(json2, "JSON2");

    const obj1 = Object.keys(json1.groups);
    const obj2 = Object.keys(json1.wallets);

    const len = obj1.filter((a) => !json1.groups[a].brand?.primaryColor);
    console.log(len, "LENGTH GROUPS");

    await fs.writeFile("len.json", JSON.stringify(len, null, 2));

    const len2 = obj2.filter((a) => !json1.wallets[a].brand?.primaryColor);
    console.log(len2, "LENGTH WALLETS");

    await fs.writeFile("len1.json", JSON.stringify(len2, null, 2));

    const walletKeys = Object.keys(json2);

    console.log(walletKeys, "walletKeys JSON2");

    walletKeys.forEach((wallet) => {
      const walletData =
        json1.groups?.[wallet] || json1.groups?.[`${wallet}wallet`] || json1.wallets?.[wallet] || json1.wallets?.[`${wallet}wallet`] || null;

      if (wallet === "aktionariat") {
        console.log(walletData, "HELLO");
      }

      if (walletData) {
        json2[wallet].primaryColor = walletData?.brand?.primaryColor || "#00000";
      } else {
        json2[wallet].primaryColor = "#00000";
      }
    });

    const updatedJSON = {};
    const removedJOSN = {};
    walletKeys.forEach((a) => {
      if (json2[a] && json2[a]?.walletConnect?.sdks?.includes("sign_v2")) {
        updatedJSON[a] = json2[a];
      } else {
        removedJOSN[a] = json2[a];
      }
    });

    const finalJSON = {};

    const updatedJSONKeys = Object.keys(updatedJSON);
    updatedJSONKeys.forEach((a) => {
      if (obj1.includes(a)) {
        finalJSON.default = { ...finalJSON.default, [a]: updatedJSON[a] };
      } else {
        finalJSON.others = { ...finalJSON.others, [a]: updatedJSON[a] };
      }
    });

    // Merge the JSON objects using custom logic
    // const mergedJson = mergeJsonObjects(json1, json2);

    // Write the merged JSON to a new file
    await fs.writeFile(outputPath, JSON.stringify(finalJSON, null, 2));
    await fs.writeFile("removed.json", JSON.stringify(removedJOSN, null, 2));
    console.log(`Merged JSON has been written to ${outputPath}`);
  } catch (error) {
    console.error("Error merging JSON files:", error);
  }
}

// Call the function to merge JSON files
mergeJsonFiles("./dynamic.json", "./web3.json", "merged.json");
