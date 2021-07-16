const { expect } = require("chai");
const { parseEther } = ethers.utils;

const time = require("../utils/time");

/**
 * This is a full e2e test of what the deploy scripts do and beyond, all the way to trading $KUST on a DEX.
 * It also attempts to attack at different points within that workflow.
 * Uses the exact same code as in ../scripts/deploy.js
 * 
 * TODO: add attack vectors
 * 
 * TODO: maybe break the deployment into different stages and then run tests at each stage? 
 * currently we run the tests after entire deployment
 */
describe('Deployment of KUST', function () {

  let deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury, user, attacker;
  let contracts;

  before(async function () {
    // TODO: Maybe put the presale in the future and make sure it cannot be used yet?
    // Or that should really be directly in a presale test I suppose
    process.env.PRESALE_START_TIME = time.getTime() + time.hour;
    process.env.PRESALE_END_TIME = (parseInt(process.env.PRESALE_START_TIME) + time.day).toString();
    contracts = await hre.run("deploy", { y: true });

    [deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury, user, attacker] = await ethers.getSigners();
  });

  it('can call the deployed contracts', async function () {
    expect(await contracts.daoFundTimelock.getMinDelay()).to.be.eq(time.week.toString());
  });

  it('minting was successful', async function () {
    const addresses = [
      contracts.daoFundTimelock.address,
      contracts.stakingRewardsTimelock.address,
      contracts.lpMiningRewardsTimelock.address,
      contracts.marketingVesting.address,
      contracts.developmentVesting1.address,
      contracts.developmentVesting2.address
    ];

    const amounts = [
      parseEther("5000000"),
      parseEther("1575000"),
      parseEther("1000000"),
      parseEther("500000"),
      parseEther("500000"),
      parseEther("500000"),
    ];

    // const total = amounts.reduce((prev, curr) => {
    //   return prev.add(curr);
    // });
    // expect(total).to.be.eq(parseEther("10000000"));

    for (let i = 0; i < addresses.length; i++) {
      expect(await contracts.kuStarterToken.balanceOf(addresses[i])).to.be.eq(amounts[i]);
    }
  });

  it('cannot be transferred yet', async function () {
    await expect(contracts.kuStarterToken.connect(saleTreasury).transfer(attacker.address, 1))
      .to.be.revertedWith("ERC20Pausable: token transfer while paused");
  });

  it('user not yet whitelisted', async function () {
    await expect(user.sendTransaction( {
      to: contracts.presale.address,
      value: parseEther("1")
    }))
    .to.be.revertedWith("You are not in the whitelist!");
  });
  
  describe('- whitelisting', function () {
    before(async function () {
      process.env.PRESALE_CONTRACT_ADDRESS = contracts.presale.address;
      
      //TODO: output user address to test-whitelist.txt 
      
      await hre.run("whitelist", { y: true, action: 'add', file: './res/test-whitelist.txt' });
    });

    it('presale not started yet', async function () {
      await expect(attacker.sendTransaction( {
        to: contracts.presale.address,
        value: parseEther("1")
      }))
      .to.be.revertedWith("presale is not active");
    });

    it('attacker still not whitelisted', async function () {
      await expect(attacker.sendTransaction( {
        to: contracts.presale.address,
        value: parseEther("1")
      }))
      .to.be.revertedWith("You are not in the whitelist!");
    });
  
  });

  // it('presale started after 1 hour', async function () {
  //   await time.increaseTime(time.hour, 1, ethers);
  //   await expect(attacker.sendTransaction( {
  //     to: contracts.presale.address,
  //     value: parseEther("1")
  //   }))
  //   .to.be.revertedWith("presale is not active");
  // });
});
