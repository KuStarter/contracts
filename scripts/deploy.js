const { parseEther } = require("ethers/lib/utils");
const yesno = require("yesno");

const utils = require("../utils");
const explorerUrl = "https://explorer.kcc.io/en/tx";

let deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury;

const txs = [];

async function addToTXList(title, txHash) {
  txs.push({ title, txHash });
}

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

async function deployTimelocks(ethers, contracts, time) {
  // DAOFundTimelock
  const DAOFundTimelock = await ethers.getContractFactory("KuStarterTimelockController");
  const daoFundTimelock = await DAOFundTimelock.deploy(time.week, [proposer], [executor]);

  await daoFundTimelock.deployed();
  log(` > DAOFundTimelock deployed to: ${daoFundTimelock.address}`);
  contracts.daoFundTimelock = daoFundTimelock;
  addToTXList("deploying DAOFundTimelock with lock of 7 days", daoFundTimelock.deployTransaction.hash);

  // StakingRewardsTimelock
  const StakingRewardsTimelock = await ethers.getContractFactory("KuStarterTimelockController");
  const stakingRewardsTimelock = await StakingRewardsTimelock.deploy(4 * time.day, [proposer], [executor]);

  await stakingRewardsTimelock.deployed();
  log(` > StakingRewardsTimelock deployed to: ${stakingRewardsTimelock.address}`);
  contracts.stakingRewardsTimelock = stakingRewardsTimelock;
  addToTXList("deploying StakingRewardsTimelock with lock of 4 days", stakingRewardsTimelock.deployTransaction.hash);

  // LPMiningRewardsTimelock
  const LPMiningRewardsTimelock = await ethers.getContractFactory("KuStarterTimelockController");
  const lpMiningRewardsTimelock = await LPMiningRewardsTimelock.deploy(4 * time.day, [proposer], [executor]);

  await lpMiningRewardsTimelock.deployed();
  log(` > LPMiningRewardsTimelock deployed to: ${lpMiningRewardsTimelock.address}`);
  contracts.lpMiningRewardsTimelock = lpMiningRewardsTimelock;
  addToTXList("deploying LPMiningRewardsTimelock with lock of 4 days", lpMiningRewardsTimelock.deployTransaction.hash);
}

async function deployPresale(ethers, contracts) {
  // Presale - below figures represent a price of 9.50 USD / KCS
  // Price as of July 21, 2021 @ 12:29 UTC
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(
    saleTreasury.address,
    38,
    parseEther("10526.3157895"),
    parseEther("25"),
    parseEther("52.6315789474"),
    process.env.PRESALE_START_TIME,
    process.env.PRESALE_END_TIME);

  await presale.deployed();
  log(` > Presale deployed to: ${presale.address}`);
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
  log(` > KuStarterToken deployed to: ${kuStarterToken.address}`);
  contracts.kuStarterToken = kuStarterToken;
  addToTXList("deploying KuStarter Token", kuStarterToken.deployTransaction.hash);
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
  log(` > SaleVesting deployed to: ${saleVesting.address}`);
  contracts.saleVesting = saleVesting;

  const balance = await contracts.kuStarterToken.balanceOf(saleTreasury.address);
  await (await contracts.kuStarterToken.connect(saleTreasury).approve(saleVesting.address, balance)).wait();
  const tx = await (await saleVesting.connect(saleTreasury).deposit(balance)).wait();
  addToTXList("adding tokens to Sale Vesting contract", tx.transactionHash);
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
  log(` > MarketingVesting deployed to: ${marketingVesting.address}`);
  contracts.marketingVesting = marketingVesting;

  const balance = await contracts.kuStarterToken.balanceOf(marketingTreasury.address);
  await (await contracts.kuStarterToken.connect(marketingTreasury).approve(marketingVesting.address, balance)).wait();
  await marketingVesting.connect(marketingTreasury).deposit(balance);

  const marketingAddresses = [
    marketingTreasury.address, //457.5k
    "0x3ef37B4Bb5e64D0D9536ad437342C216107d6DF5", //8k
    "0x49E06C535F31feC81831D69FdDe2d0427d6Dd0C4", //2.5k
    "0xa8C7864111e1e29ea89140900aB0b997be47f1bf", //2k
    "0x3049B83eDc77dDae90c709F7677bd6D2dBb821ED", //30k
  ];

  const ends = Array(marketingAddresses.length).fill(process.env.MARKETING_VESTING_END_TIME);

  const amounts = [
    parseEther("457500"), //457.5k
    parseEther("8000"), //8k
    parseEther("2500"), //2.5k
    parseEther("2000"), //2k
    parseEther("30000"), //30k
  ];

  const initials = Array(marketingAddresses.length).fill(0);

  const tx = await(await marketingVesting.connect(marketingTreasury).submitMulti(marketingAddresses, ends, amounts, initials)).wait();
  addToTXList("adding tokens to Marketing Vesting contract", tx.transactionHash);
}

async function deployDevelopmentVesting(ethers, contracts) {
  //DevelopmentVesting1 - 50%
  const DevelopmentVesting1 = await ethers.getContractFactory("TokenVesting");
  const developmentVesting1 = await DevelopmentVesting1.deploy(
    developmentTreasury.address,
    developmentTreasury.address,
    process.env.PRESALE_END_TIME,
    contracts.kuStarterToken.address
  );

  await developmentVesting1.deployed();
  log(` > DevelopmentVesting1 deployed to: ${developmentVesting1.address}`);
  contracts.developmentVesting1 = developmentVesting1;

  const balance = parseEther("500000");
  await (await contracts.kuStarterToken.connect(developmentTreasury).approve(developmentVesting1.address, balance)).wait();
  await developmentVesting1.connect(developmentTreasury).deposit(balance);

  let tx = await (await developmentVesting1.connect(developmentTreasury).submit(developmentTreasury.address, process.env.DEVELOPMENT_1_VESTING_END_TIME, balance, 0)).wait();
  addToTXList("adding tokens to Development Vesting 1 contract", tx.transactionHash);

  //DevelopmentVesting2 - 50%
  const DevelopmentVesting2 = await ethers.getContractFactory("TokenVesting");
  const developmentVesting2 = await DevelopmentVesting2.deploy(
    developmentTreasury.address,
    developmentTreasury.address,
    process.env.PRESALE_END_TIME,
    contracts.kuStarterToken.address
  );

  await developmentVesting2.deployed();
  log(` > DevelopmentVesting2 deployed to: ${developmentVesting2.address}`);
  contracts.developmentVesting2 = developmentVesting2;

  await (await contracts.kuStarterToken.connect(developmentTreasury).approve(developmentVesting2.address, balance)).wait();
  await developmentVesting2.connect(developmentTreasury).deposit(balance);

  tx = await (await developmentVesting2.connect(developmentTreasury).submit(developmentTreasury.address, process.env.DEVELOPMENT_2_VESTING_END_TIME, balance, 0)).wait();
  addToTXList("adding tokens to Development Vesting 2 contract", tx.transactionHash);
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

  let tx = await contracts.presale.initialize(
    contracts.kuStarterToken.address,
    contracts.saleVesting.address,
    seedAddresses,
    ends,
    amounts,
    initials
  );
  tx = await tx.wait(); // wait for it to be mined
  addToTXList("initializing Presale contract", tx.transactionHash);
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

  const time = new (require("../utils/time"))(ethers);

  const presaleStartTime = parseInt(process.env.PRESALE_START_TIME);
  process.env.PRESALE_END_TIME = (presaleStartTime + time.day).toString();
  process.env.VESTING_START_TIME = (presaleStartTime + 2 * time.week).toString();
  process.env.SEED_VESTING_END_TIME = (presaleStartTime + 36 * time.week).toString();
  process.env.MARKETING_VESTING_END_TIME = (presaleStartTime + 12 * time.week).toString();
  process.env.DEVELOPMENT_1_VESTING_END_TIME = (presaleStartTime + 12 * time.week).toString();
  process.env.DEVELOPMENT_2_VESTING_END_TIME = (presaleStartTime + 52 * time.week).toString();

  // Please ensure to add environment variables that are needed here
  const envVarsSet = utils.checkEnvVars(
    "PRESALE_START_TIME",
    "PRESALE_END_TIME",
    "VESTING_START_TIME",
    "SEED_VESTING_END_TIME",
    "MARKETING_VESTING_END_TIME",
    "DEVELOPMENT_1_VESTING_END_TIME",
    "DEVELOPMENT_2_VESTING_END_TIME"
  );
  if (!envVarsSet) {
    console.error("Environment variables not setup correctly. Quitting.");
    return;
  }

  log("PRESALE_START_TIME = " + new Date(process.env.PRESALE_START_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));
  log("PRESALE_END_TIME = " + new Date(process.env.PRESALE_END_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));
  log("VESTING_START_TIME = " + new Date(process.env.VESTING_START_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));
  log("SEED_VESTING_END_TIME = " + new Date(process.env.SEED_VESTING_END_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));
  log("MARKETING_VESTING_END_TIME = " + new Date(process.env.MARKETING_VESTING_END_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));
  log("DEVELOPMENT_1_VESTING_END_TIME = " + new Date(process.env.DEVELOPMENT_1_VESTING_END_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));
  log("DEVELOPMENT_2_VESTING_END_TIME = " + new Date(process.env.DEVELOPMENT_2_VESTING_END_TIME*1000).toLocaleString("en-GB", {timeZone: "utc"}));

  let ok = skipQuestions ? true : await yesno({ question: `Are you sure you want to deploy on ${hre.network.name} (y/n)?` });
  if (!ok) {
    console.error("Quitting.");
    return;
  }

  log(`Deploying on ${hre.network.name}...`);

  [deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury] = await ethers.getSigners();
  proposer = proposer.address;
  executor = executor.address;

  const contracts = {};

  await deployTimelocks(ethers, contracts, time);
  await deployPresale(ethers, contracts);
  await deployToken(ethers, contracts);
  await deploySaleVesting(ethers, contracts);
  await deployMarketingVesting(ethers, contracts);
  await deployDevelopmentVesting(ethers, contracts);
  await initializePresale(contracts);
  await contracts.kuStarterToken.pause();

  txs.forEach(tx => {
    log(`Tx for ${tx.title} mined with hash ${explorerUrl}/${tx.txHash}`);
  });

  return contracts;
};
