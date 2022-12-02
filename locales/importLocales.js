/* eslint-disable no-console */
/* eslint-disable promise/always-return */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const branch = args[0] || "main";
const repoUrl = `https://raw.githubusercontent.com/Web3Auth/web3auth-locales/${branch}/Web3Auth-locale`;
const localeGroups = ["locale-common"];
const promises = [];
const locales = {};

localeGroups.forEach((group) => {
  const urlFetch = `${repoUrl}/${group}.json`;
  promises.push(fetch(urlFetch).then((res) => res.json()));
});

function processRecords(items) {
  Object.keys(items).forEach((groupKey) => {
    Object.keys(items[groupKey]).forEach((wordKey) => {
      Object.keys(items[groupKey][wordKey]).forEach((localeKey) => {
        if (!locales[localeKey]) locales[localeKey] = {};
        if (!locales[localeKey][groupKey]) locales[localeKey][groupKey] = {};
        locales[localeKey][groupKey][wordKey] = items[groupKey][wordKey][localeKey];
      });
    });
  });
}

Promise.all(promises)
  .then((results) => {
    results.forEach((set) => {
      processRecords(set);
    });

    // Create json files
    const folder = "./packages/ui/src/i18n/";
    const folderPath = path.resolve(folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const keys = Object.keys(locales);
    for (const localeKey of keys) {
      if (Object.prototype.hasOwnProperty.call(locales, localeKey)) {
        const filePath = path.resolve(`${folder}${localeKey}.json`);
        fs.writeFile(filePath, JSON.stringify(locales[localeKey], null, 2), { flag: "w" }, (error) => {
          if (error) throw error;
        });
      }
    }
  })
  .catch((error) => {
    console.error(error);
  });
