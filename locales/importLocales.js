/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable promise/always-return */
const http = require("http");
const fs = require("fs");
const path = require("path");
const log = require("loglevel");

// const localeUrl = "https://api.tor.us/locales/open-login";
const localeUrl = "http://localhost:2020/locales/web3auth";

function getLocale() {
  return new Promise((resolve, reject) => {
    const request = http.get(`${localeUrl}`, (response) => {
      let body = "";
      response.on("data", (data) => {
        body += data;
      });
      response.on("end", () => {
        resolve(JSON.parse(body));
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

getLocale()
  .then((result) => {
    const locales = result.data;
    const folders = ["./packages/ui/src/i18n/"];
    folders.forEach((folder) => {
      const folderPath = path.resolve(folder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
    });

    // Create json files
    const keys = Object.keys(locales);
    for (const localeKey of keys) {
      if (Object.prototype.hasOwnProperty.call(locales, localeKey)) {
        folders.forEach((folder) => {
          const filePath = path.resolve(`${folder}${localeKey}.json`);
          fs.writeFile(filePath, JSON.stringify(locales[localeKey], null, 2), { flag: "w" }, (error) => {
            if (error) throw error;
          });
        });
      }
    }
  })
  .catch((error) => {
    log.error(error);
  });
