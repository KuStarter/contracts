const hre = require("hardhat");
const yesno = require("yesno");

async function main() {
  let ok = await yesno({ question: `Are you sure you want to deploy on ${hre.network.name} (y/n)?` });
  if(!ok) {
    return;
  }

  // Deploy DAOFundTimelock, StakingRewardsTimelock, LPMiningRewardsTimelock
  // Deploy Presale
  // Presale.addToWhitelistMulti()
  // Deploy $KUST token:
    // mint 5,000,000 to DAOFundTimelock
    // mint 1,000,000 to LPMiningRewardsTimelock
    // mint 1,575,000 to StakingRewardsTimelock
    // mint 700,000 to Sale Treasury (EOA)
    // mint 500,000 to Marketing Treasury (EOA)
    // mint 1,000,000 to Development Treasury (EOA)
    // mint 225,000 to Presale for liquidity
  // Deploy Vesting for seed and presale (_start must be two weeks after listing)
  // Sale Treasury calls Vesting.deposit()
  // Presale.initialize() with Vesting address and private sale investors
  // Deploy Vesting for marketing
  // Marketing Treasury calls Vesting.deposit()
  // Deploy Vesting for development first 50%
  // Development Treasury calls Vesting.deposit()
  // Deploy Vesting for development second 50%
  // Development Treasury calls Vesting.deposit()

  // const Greeter = await hre.ethers.getContractFactory("Greeter");
  // const greeter = await Greeter.deploy("Hello, Hardhat!");

  // await greeter.deployed();

  // console.log("Greeter deployed to:", greeter.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
