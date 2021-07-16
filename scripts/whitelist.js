const fs = require('fs');
const readline = require('readline');

const yesno = require("yesno");

const utils = require("../utils");

async function getAddresses(file) {
  const fileStream = fs.createReadStream(file);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const addresses = [];

  for await (const line of rl) {
    if(line) {
      addresses.push(ethers.utils.getAddress(line));
    }
  }

  return addresses;
}

module.exports = async (args) => {
  const skipQuestions = args.y;
  if (skipQuestions) {
    console.warn("You have passed --y, which means you will not be prompted for any confirmations! Giving you 3 seconds to kill me...");
    await utils.sleep(3000);
    console.warn("Time is up! Let's go!");
  }

  // Please ensure to add environment variables that are needed here
  const envVarsSet = utils.checkEnvVars(
    "PRESALE_CONTRACT_ADDRESS"
  );
  if (!envVarsSet) {
    console.error("Environment variables not setup correctly. Quitting.");
    return;
  }

  if(args.action !== "add" && args.action !== "remove") {
    console.error(`You must pass either "add" or "remove" as an action.`);
    return;
  }

  const addresses = await getAddresses(args.file);

  console.log("Found addresses:");
  console.log(addresses);

  [deployer] = await ethers.getSigners();

  const presaleAddress = ethers.utils.getAddress(process.env.PRESALE_CONTRACT_ADDRESS);
  const presale = await ethers.getContractAt("Presale", presaleAddress, deployer);

  let ok = skipQuestions ? true : await yesno({ question: `Are you sure you want to whitelist those addresses on ${hre.network.name} against Presale contract ${presaleAddress} (y/n)?` });
  if (!ok) {
    return;
  }

  // Presale.addToWhitelistMulti()
  // Presale.removeFromWhitelistMulti()
};
