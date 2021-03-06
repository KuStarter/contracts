const fs = require('fs');
const readline = require('readline');

const yesno = require("yesno");

const utils = require("../utils");

let shouldLog = true;

function log(message) {
  if(shouldLog) {
    console.log(message);
  }
}

function warn(message) {
  if(shouldLog) {
    console.warn(message);
  }
}

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
  if(args.s) { // should log
    shouldLog = false;
  }

  const skipQuestions = args.y;
  if (skipQuestions) {
    warn("You have passed --y, which means you will not be prompted for any confirmations! Giving you 3 seconds to kill me...");
    await utils.sleep(3000);
    warn("Time is up! Let's go!");
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

  log("Found addresses:");
  log(addresses);

  [deployer] = await ethers.getSigners();

  const presaleAddress = ethers.utils.getAddress(process.env.PRESALE_CONTRACT_ADDRESS);
  const presale = await ethers.getContractAt("Presale", presaleAddress, deployer);

  let ok = skipQuestions ? true : await yesno({ question: `Are you sure you want to whitelist those addresses on ${hre.network.name} against Presale contract ${presaleAddress} (y/n)?` });
  if (!ok) {
    return;
  }

  let verb;
  if (args.action === "add") {
    await (await presale.addToWhitelistMulti(addresses)).wait();
    verb = "added";
  } else { 
    await (await presale.removeFromWhitelistMulti(addresses)).wait();
    verb = "removed";
  }

  log(`Successfully ${verb} addresses.`);
};
