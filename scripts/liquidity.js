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

  if(!args.amount) {
    console.error("You must provide an amount of tokens.");
    return;
  }

  const [deployer] = await ethers.getSigners();

  const presaleAddress = ethers.utils.getAddress(process.env.PRESALE_CONTRACT_ADDRESS);
  const presale = await ethers.getContractAt("Presale", presaleAddress, deployer);

  let ok = skipQuestions ? true : await yesno({ question: `Are you sure you want to add liquidity on ${hre.network.name} against Presale contract ${presaleAddress} for amount ${args.amount} (y/n)?` });
  if (!ok) {
    return;
  }
  
  const tx = await (await presale.addLiquidity(args.amount)).wait();

  log(`Successfully added liquidity in txHash ${tx.transactionHash}.`);
};
