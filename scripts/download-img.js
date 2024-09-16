/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

// const axios = require("axios"); // Install axios

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
  return new Promise((resolve) => {
    const filePath = path.join("./wallet-logos", fileName);

    const reader = response.body.getReader();
    const writableStream = fs.createWriteStream(filePath);

    // Function to read and write chunks
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) {
        writableStream.end();
        console.log(`Successfully saved ${fileName}`);
        resolve(); // Close the writable stream when done
        return;
      }
      writableStream.write(value); // Write the chunk to the file
      pump(); // Continue reading
    };

    pump();

    // const writer = fs.createWriteStream(filePath);

    // console.log(response);

    // response.body.pipe(writer);

    // writer.on("finish", () => {
    //   console.log(`Successfully saved ${fileName}`);
    //   resolve();
    // });

    // writer.on("error", (err) => {
    //   console.error(`Error saving ${fileName}:`, err);
    //   reject(err);
    // });
  });
};

const allData = { ...data.others, ...data.default };

// Main process
const processWallets = async () => {
  for (const [key, value] of Object.entries(allData)) {
    const { image_id } = value;
    if (image_id) {
      try {
        const response = await fetch(`${baseUrl}${image_id}`, {
          method: "GET",
          headers: {
            "x-project-id": "bd4997ce3ede37c95770ba10a3804dad",
            "x-sdk-type": "w3m",
            "x-sdk-version": "html-wagmi-5.1.4",
            origin: "https://evmtest.walletconnect.com/",
          },
        });

        console.log(response.headers.get("Content-Type"), "CONTENT TYPE");
        // Check if the response is ok (status 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! Status ${key}: ${response.status}`);
        }

        const contentType = response.headers.get("Content-Type");
        const extension = contentType.split("/").pop();
        const fileName = `login-${sanitizeFileName(key)}.${extension}`.replace("+xml", "");
        console.log(fileName);
        await saveFile(response, fileName);

        // await uploadToS3(response.data, fileName);
      } catch (error) {
        console.error(`Failed to process: ${key}`, error.message);
      }
    } else {
      console.log("NO IMAGE ID", key);
    }
  }
};

processWallets()
  .then(() => console.log("Process completed."))
  .catch((err) => console.error(err));
