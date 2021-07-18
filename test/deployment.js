const fs = require('fs');
const { expect } = require("chai");
const { parseEther } = ethers.utils;

const time = new (require("../utils/time"))(ethers);

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
    const presaleStartTime = await time.getBlockchainTime() + time.hour;
    process.env.PRESALE_START_TIME = (presaleStartTime).toString();
    process.env.PRESALE_END_TIME = (presaleStartTime + time.day).toString();
    process.env.VESTING_START_TIME = (presaleStartTime + 2 * time.week).toString();
    process.env.SEED_VESTING_END_TIME = (presaleStartTime + 36 * time.week).toString();
    process.env.MARKETING_VESTING_END_TIME = (presaleStartTime + 12 * time.week).toString();
    process.env.DEVELOPMENT_1_VESTING_END_TIME = (presaleStartTime + 12 * time.week).toString();
    process.env.DEVELOPMENT_2_VESTING_END_TIME = (presaleStartTime + 52 * time.week).toString();
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

    for (let i = 0; i < addresses.length; i++) {
      expect(await contracts.kuStarterToken.balanceOf(addresses[i])).to.be.eq(amounts[i]);
    }
  });

  it('cannot be transferred yet', async function () {
    await expect(contracts.kuStarterToken.connect(saleTreasury).transfer(attacker.address, 1))
      .to.be.revertedWith("ERC20Pausable: token transfer while paused");
  });

  it('user not yet whitelisted', async function () {
    await expect(user.sendTransaction({
      to: contracts.presale.address,
      value: parseEther("1")
    }))
      .to.be.revertedWith("You are not in the whitelist!");
  });

  describe('Whitelisting', function () {
    before(async function () {
      process.env.PRESALE_CONTRACT_ADDRESS = contracts.presale.address;

      const file = `${__dirname}/res/test-whitelist.txt`;
      const data = user.address + "\n";
      fs.writeFileSync(file, data);

      await hre.run("whitelist", { y: true, action: 'add', file });
    });

    it('presale not started yet', async function () {
      await expect(user.sendTransaction({
        to: contracts.presale.address,
        value: parseEther("1")
      }))
        .to.be.revertedWith("presale is not active");
    });

    it('attacker still not whitelisted', async function () {
      await expect(attacker.sendTransaction({
        to: contracts.presale.address,
        value: parseEther("1")
      }))
        .to.be.revertedWith("You are not in the whitelist!");
    });

    it('presale started after 1 hour', async function () {
      await time.increaseTime(time.hour, 1);

      await user.sendTransaction({
        to: contracts.presale.address,
        value: parseEther("50")
      });
    });

    it('has tokens, but cannot send them', async function () {
      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("400"));

      await expect(contracts.kuStarterToken.transfer(attacker.address, parseEther("1")))
        .to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });


    it('liquidity cannot be added until presale is over', async function () {
      await expect(contracts.presale.addLiquidity())
        .to.be.revertedWith("Presale is still active");
    });

    it('presale will end and liquidity can be added', async function () {
      await time.increaseTime(time.hour, 24);

      await expect(contracts.presale.connect(attacker).addLiquidity())
        .to.be.revertedWith("Ownable: caller is not the owner");
      
      await contracts.presale.addLiquidity();

      //TODO: Check with some tests against Koffeeswap
      // https://docs.koffeeswap.finance/contracts/exchange-contracts/router
    });

    it('now can send their tokens', async function () {
      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("400"));

      await contracts.kuStarterToken.connect(user).transfer(attacker.address, parseEther("1"));

      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("399"));
      expect(await contracts.kuStarterToken.balanceOf(attacker.address)).to.be.eq(parseEther("1"));
    });
    
  });
});
