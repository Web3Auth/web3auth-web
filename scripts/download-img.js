/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
// eslint-disable-next-line import/no-extraneous-dependencies
const axios = require("axios"); // Install axios

// Load the JSON data
const rawData = fs.readFileSync("./wallet-registry-updated.json");
const data = JSON.parse(rawData);

// Base URL for fetching wallet images
const baseUrl = "https://api.web3modal.org/getWalletImage/";

// Function to sanitize file name
const sanitizeFileName = (name) => {
  return name.replace(" ", "-").toLowerCase();
};

const saveFile = (response, fileName) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join("./wallet-logos", fileName);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      console.log(`Successfully saved ${fileName}`);
      resolve();
    });

    writer.on("error", (err) => {
      console.error(`Error saving ${fileName}:`, err);
      reject(err);
    });
  });
};

const allData = { ...data.others, ...data.default };

// Main process
const processWallets = async () => {
  for (const [key, value] of Object.entries(allData)) {
    const { image_id } = value;
    if (image_id) {
      try {
        const response = await axios({
          method: "get",
          url: `${baseUrl}${image_id}`,
          responseType: "stream",
          headers: {
            "x-project-id": "bd4997ce3ede37c95770ba10a3804dad",
            "x-sdk-type": "w3m",
            "x-sdk-version": "html-wagmi-5.1.4",
            origin: "https://evmtest.walletconnect.com/",
          },
        });

        const contentType = response.headers["content-type"];
        const extension = contentType.split("/").pop();
        const fileName = `login-${sanitizeFileName(key)}.${extension}`;
        console.log(fileName);
        await saveFile(response, fileName);

        // await uploadToS3(response.data, fileName);
      } catch (error) {
        console.error(`Failed to process ${name}:`, error.message);
      }
    } else {
      console.log("NO IMAGE ID", key);
    }
  }
};

processWallets()
  .then(() => console.log("Process completed."))
  .catch((err) => console.error(err));
