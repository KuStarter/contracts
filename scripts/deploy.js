const { parseEther } = require("ethers/lib/utils");
const yesno = require("yesno");

const time = require("../utils/time");

let deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkEnvVars(...envVars) {
  return envVars.every(envVar => {
    if (!process.env[envVar]) {
      console.warn(`${envVar} not set.`);
      return false;
    }
    return true;
  });
}

async function deployTimelocks(ethers, contracts) {
  // DAOFundTimelock
  const DAOFundTimelock = await ethers.getContractFactory("TimelockController");
  const daoFundTimelock = await DAOFundTimelock.deploy(time.week, [proposer], [executor]);

  await daoFundTimelock.deployed();
  console.log(` > DAOFundTimelock deployed to: ${daoFundTimelock.address}`);
  contracts.daoFundTimelock = daoFundTimelock;

  // StakingRewardsTimelock
  const StakingRewardsTimelock = await ethers.getContractFactory("TimelockController");
  const stakingRewardsTimelock = await StakingRewardsTimelock.deploy(4 * time.day, [proposer], [executor]);

  await stakingRewardsTimelock.deployed();
  console.log(` > StakingRewardsTimelock deployed to: ${stakingRewardsTimelock.address}`);
  contracts.stakingRewardsTimelock = stakingRewardsTimelock;

  // LPMiningRewardsTimelock
  const LPMiningRewardsTimelock = await ethers.getContractFactory("TimelockController");
  const lpMiningRewardsTimelock = await LPMiningRewardsTimelock.deploy(4 * time.day, [proposer], [executor]);

  await lpMiningRewardsTimelock.deployed();
  console.log(` > LPMiningRewardsTimelock deployed to: ${lpMiningRewardsTimelock.address}`);
  contracts.lpMiningRewardsTimelock = lpMiningRewardsTimelock;
}

async function deployPresale(ethers, contracts) {
  // Presale - below figures represent a price of 10 USD / KCS
  // TODO: Check below figures
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(saleTreasury.address,
    parseEther("40"),
    parseEther("10000"),
    parseEther("25"),
    parseEther("25"),
    process.env.PRESALE_START_TIME,
    process.env.PRESALE_END_TIME);

  await presale.deployed();
  console.log(` > Presale deployed to: ${presale.address}`);
  contracts.presale = presale;
}

async function deployToken(ethers, contracts) {
  const receivers = [
    contracts.daoFundTimelock.address,
    contracts.stakingRewardsTimelock.address,
    contracts.lpMiningRewardsTimelock.address,
    developmentTreasury.address,
    saleTreasury.address,
    marketingTreasury.address,
    contracts.presale.address
  ];

  const amounts = [
    parseEther("5000000"),
    parseEther("1575000"),
    parseEther("1000000"),
    parseEther("1000000"),
    parseEther("700000"),
    parseEther("500000"),
    parseEther("225000")
  ];

  //KuStarterToken
  const KuStarterToken = await ethers.getContractFactory("KuStarterToken");
  const kuStarterToken = await KuStarterToken.deploy(receivers, amounts, contracts.presale.address);

  await kuStarterToken.deployed();
  console.log(` > KuStarterToken deployed to: ${kuStarterToken.address}`);
  contracts.kuStarterToken = kuStarterToken;
}

async function deploySaleVesting(ethers, contracts) {
  //SaleVesting
  const SaleVesting = await ethers.getContractFactory("TokenVesting");
  const saleVesting = await Vesting.deploy(
    contracts.presale.address, 
    saleTreasury.address, 
    process.env.VESTING_START_TIME, 
    contracts.kuStarterToken.address
  );

  await saleVesting.deployed();
  console.log(` > SaleVesting deployed to: ${saleVesting.address}`);
  contracts.saleVesting = saleVesting;
}
/**
 * Deploy DAOFundTimelock, StakingRewardsTimelock, LPMiningRewardsTimelock
 * Deploy Presale
 * Deploy $KUST token:
   * mint 5,000,000 to DAOFundTimelock
   * mint 1,575,000 to StakingRewardsTimelock
   * mint 1,000,000 to LPMiningRewardsTimelock
   * mint 1,000,000 to Development Treasury (EOA)
   * mint 700,000 to Sale Treasury (EOA)
   * mint 500,000 to Marketing Treasury (EOA)
   * mint 225,000 to Presale for liquidity
 * Deploy Vesting for seed and presale (_start must be two weeks after listing)
 * Sale Treasury calls Vesting.deposit()
 * Presale.initialize() with Vesting address and private sale investors
 * Deploy Vesting for marketing
 * Marketing Treasury calls Vesting.deposit()
 * Deploy Vesting for development first 50%
 * Development Treasury calls Vesting.deposit()
 * Deploy Vesting for development second 50%
 * Development Treasury calls Vesting.deposit()
 */
module.exports = async (args) => {
  const skipQuestions = args.y;
  if (skipQuestions) {
    console.warn("You have passed --y, which means you will not be prompted for any confirmations! Giving you 3 seconds to kill me...");
    await sleep(3000);
    console.warn("Time is up! Let's go!");
  }

  let ok = skipQuestions ? true : await yesno({ question: `Are you sure you want to deploy on ${hre.network.name} (y/n)?` });
  if (!ok) {
    console.error("Quitting.");
    return;
  }

  console.log(`Deploying on ${hre.network.name}...`);

  [deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury] = await ethers.getSigners();
  proposer = proposer.address;
  executor = executor.address;

  const contracts = {};

  // Please ensure to add environment variables that are needed here
  const envVarsSet = checkEnvVars(
    "PRESALE_START_TIME",
    "PRESALE_END_TIME",
    "VESTING_START_TIME"
  );
  if (!envVarsSet) {
    console.error("Environment variables not setup correctly. Quitting.");
    return;
  }

  await deployTimelocks(ethers, contracts);
  await deployPresale(ethers, contracts);
  await deployToken(ethers, contracts);
  await deploySaleVesting(ethers, contracts);
  // await initializePresale(ethers, contracts);
  // await deployMarketingVesting(ethers, contracts);
  // await deployDevelopmentVesting(ethers, contracts);

  return contracts;
};
