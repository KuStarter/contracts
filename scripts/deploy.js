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
  const saleVesting = await SaleVesting.deploy(
    contracts.presale.address, 
    saleTreasury.address, 
    process.env.VESTING_START_TIME, 
    contracts.kuStarterToken.address
  );

  await saleVesting.deployed();
  console.log(` > SaleVesting deployed to: ${saleVesting.address}`);
  contracts.saleVesting = saleVesting;

  const balance = contracts.kuStarterToken.balanceOf(saleTreasury.address);
  await contracts.kuStarterToken.connect(saleTreasury).approve(saleVesting.address, balance);
  await saleVesting.connect(saleTreasury).deposit(balance);
}

async function deployMarketingVesting(ethers, contracts) {
  //MarketingVesting
  const MarketingVesting = await ethers.getContractFactory("TokenVesting");
  const marketingVesting = await MarketingVesting.deploy(
    marketingTreasury.address,
    marketingTreasury.address, 
    process.env.PRESALE_END_TIME, 
    contracts.kuStarterToken.address
  );

  await marketingVesting.deployed();
  console.log(` > MarketingVesting deployed to: ${marketingVesting.address}`);
  contracts.marketingVesting = marketingVesting;

  const balance = contracts.kuStarterToken.balanceOf(marketingTreasury.address);
  await contracts.kuStarterToken.connect(marketingTreasury).approve(marketingVesting.address, balance);
  await marketingVesting.connect(marketingTreasury).deposit(balance);

  // TODO: Add marketing wallets, they are in notion
  // await marketingVesting.connect(marketingTreasury).submit(balance);
}

async function initializePresale(contracts) {
  const seedAddresses = [
    "0xCEd35166d78a980a11fE563c9D3f6b7D5DfB730D", //10k
    "0x35a214b13c9E223B8D511f343aC8Fa94293233a1", //5k
    "0x95272Acc5000f969215508b1A1d3840E63Af0680", //5k
    "0xae6f738b938789a9223b2797e5adbc84CB69CCd4", //10k
    "0x63eE555F1fea9798f09069b4830CbaA7E6E251c2", //2.5k
    "0x826BCEA879E4496Ed163BCC128926B5627E1f08d", //10k
    "0x1BF01C70F721c2BB5Aee4dBAbb6DeA05A6F844fb", //2.5k
    "0x180eB99B20C7D6A436f7D51e7638A059188A6fBE", //3k
    "0x06e045b036E4EDAB1C2497F1f828d932882f0E44", //1k
    "0xC62075daa1cb009036249f2BAABF515BD87D29Bc", //1k
    "0xa48b95196E8e75C3350e5997333D76f7fa89803b" //10k
  ];

  const ends = Array(seedAddresses.length).fill(process.env.SEED_VESTING_END_TIME);

  const amounts = [
    parseEther("50000"), //10k
    parseEther("25000"), //5k
    parseEther("25000"), //5k
    parseEther("50000"), //10k
    parseEther("12500"), //2.5k
    parseEther("50000"), //10k
    parseEther("12500"), //2.5k
    parseEther("15000"), //3k
    parseEther("5000"), //1k
    parseEther("5000"), //1k
    parseEther("50000") //10k
  ];

  const initials = Array(seedAddresses.length).fill(20);

  const tx = await contracts.presale.initialize(
    contracts.kuStarterToken.address,
    contracts.saleVesting.address,
    seedAddresses,
    ends,
    amounts,
    initials
  );
  await tx.wait(); // wait for it to be mined
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
 * Deploy Vesting for marketing
 * Marketing Treasury calls Vesting.deposit() and submit
 * Deploy Vesting for development first 50%
 * Development Treasury calls Vesting.deposit()
 * Deploy Vesting for development second 50%
 * Development Treasury calls Vesting.deposit()
 * Presale.initialize() with Vesting address and private sale investors
 * token.pause()
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
    "VESTING_START_TIME",
    "SEED_VESTING_END_TIME"
  );
  if (!envVarsSet) {
    console.error("Environment variables not setup correctly. Quitting.");
    return;
  }

  await deployTimelocks(ethers, contracts);
  await deployPresale(ethers, contracts);
  await deployToken(ethers, contracts);
  await deploySaleVesting(ethers, contracts);
  await deployMarketingVesting(ethers, contracts);
  // await deployDevelopmentVesting(ethers, contracts);
  await initializePresale(contracts);
  await contracts.kuStarterToken.pause();

  return contracts;
};
