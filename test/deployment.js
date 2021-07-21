const fs = require('fs');
const { expect } = require("chai");
const { parseEther, getCreate2Address } = ethers.utils;
const KoffeeswapPairABI = require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;

const utils = require("../utils");
const time = new (require("../utils/time"))(ethers);
const KoffeeswapRouterABI = require("../utils/KoffeeSwapRouter.abi.json");

/**
 * This is a full e2e test of what the deploy scripts do and beyond, all the way to trading $KUST on a DEX.
 * It also attempts to attack at different points within that workflow.
 * Uses the exact same code as in ../scripts/deploy.js
 */
describe('Deployment of KUST', function () {

  let deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury, user, attacker, trader;
  let contracts, koffeeswap, wkcsAddress, pair;
  let deadline;

  before(async function () {
    const presaleStartTime = await time.getBlockchainTime() + time.hour;
    process.env.PRESALE_START_TIME = (presaleStartTime).toString();
    process.env.PRESALE_END_TIME = (presaleStartTime + time.day).toString();
    process.env.VESTING_START_TIME = (presaleStartTime + 2 * time.week).toString();
    process.env.SEED_VESTING_END_TIME = (presaleStartTime + 36 * time.week).toString();
    process.env.MARKETING_VESTING_END_TIME = (presaleStartTime + 12 * time.week).toString();
    process.env.DEVELOPMENT_1_VESTING_END_TIME = (presaleStartTime + 12 * time.week).toString();
    process.env.DEVELOPMENT_2_VESTING_END_TIME = (presaleStartTime + 52 * time.week).toString();
    contracts = await hre.run("deploy", { y: true, s: true });

    [deployer, proposer, executor, saleTreasury, marketingTreasury, developmentTreasury, user, attacker, trader] = await ethers.getSigners();

    koffeeswap = new ethers.Contract("0xc0fFee0000C824D24E0F280f1e4D21152625742b", KoffeeswapRouterABI, deployer);
    wkcsAddress = await koffeeswap.WKCS();
    const pairAddress = utils.computeKoffeeSwapPairAddress(await koffeeswap.factory(), wkcsAddress, contracts.kuStarterToken.address, ethers);
    pair = new ethers.Contract(pairAddress, KoffeeswapPairABI, deployer);
    deadline = await time.getBlockchainTime() + 604800;
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
      contracts.developmentVesting2.address,
      contracts.presale.address,
      saleTreasury.address
    ];

    const amounts = [
      parseEther("5000000"),
      parseEther("1575000"),
      parseEther("1000000"),
      parseEther("500000"),
      parseEther("500000"),
      parseEther("500000"),
      parseEther("225000"),
      "0",
    ];

    for (let i = 0; i < addresses.length; i++) {
      expect(await contracts.kuStarterToken.balanceOf(addresses[i])).to.be.eq(amounts[i]);
    }
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

      await hre.run("whitelist", { y: true, s: true, action: 'add', file });
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


    it('attacker still not whitelisted', async function () {
      expect(await contracts.presale.whitelist(attacker.address)).to.be.eq(false);
      await expect(attacker.sendTransaction({
        to: contracts.presale.address,
        value: parseEther("1")
      }))
        .to.be.revertedWith("You are not in the whitelist!");

      await contracts.presale.addToWhitelist(attacker.address);
      expect(await contracts.presale.whitelist(attacker.address)).to.be.eq(true);

      await contracts.presale.removeFromWhitelist(attacker.address);
      expect(await contracts.presale.whitelist(attacker.address)).to.be.eq(false);
    });

    it('presale started after 1 hour', async function () {
      await time.increaseTime(time.hour, 1);

      expect(await contracts.presale.whitelist(user.address)).to.be.eq(true);

      await user.sendTransaction({
        to: contracts.presale.address,
        value: parseEther("50")
      });
    });

    it('has tokens, but cannot send them', async function () {
      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("380"));

      await expect(contracts.kuStarterToken.transfer(attacker.address, parseEther("1")))
        .to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });

    it('liquidity cannot be added until presale is over', async function () {
      await expect(contracts.presale.addLiquidity(1))
        .to.be.revertedWith("Presale is still active");
    });

    it('presale will end and liquidity can be added', async function () {
      await time.increaseTime(time.hour, 24);

      const liq = await contracts.kuStarterToken.balanceOf(contracts.presale.address);

      await expect(contracts.presale.connect(attacker).addLiquidity(liq))
        .to.be.revertedWith("Ownable: caller is not the owner");

      const bal = await saleTreasury.getBalance();
      await contracts.presale.addLiquidity(liq);
      expect(await saleTreasury.getBalance()).to.be.eq(bal.add(parseEther("25")));
    });

    it('liquidity cannot be added twice', async function () {
      await expect(contracts.presale.addLiquidity(1)).to.be.revertedWith("Presale is already completed");
    });

    it('now can send their tokens', async function () {
      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("380"));

      await contracts.kuStarterToken.connect(user).transfer(attacker.address, parseEther("1"));

      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("379"));
      expect(await contracts.kuStarterToken.balanceOf(attacker.address)).to.be.eq(parseEther("1"));
    });

    it('traders can buy and sell on Koffeeswap', async function () {
      expect(await contracts.kuStarterToken.balanceOf(trader.address)).to.be.eq(parseEther("0"));

      let amountOut = (
        await koffeeswap.connect(trader).getAmountsOut(parseEther("5"), [wkcsAddress, contracts.kuStarterToken.address])
      )[1];
      expect(amountOut).to.be.gt(parseEther("10"));

      await koffeeswap.connect(trader).swapKCSForExactTokens(amountOut, [wkcsAddress, contracts.kuStarterToken.address], trader.address, deadline, {
        value: parseEther("5")
      });

      let balance = amountOut;
      expect(await contracts.kuStarterToken.balanceOf(trader.address)).to.be.eq(balance);

      amountOut = (
        await koffeeswap.connect(trader).getAmountsOut(parseEther("10"), [contracts.kuStarterToken.address, wkcsAddress])
      )[1];

      await contracts.kuStarterToken.connect(trader).approve(koffeeswap.address, parseEther("10"));
      await koffeeswap.connect(trader).swapExactTokensForKCS(parseEther("10"), amountOut, [contracts.kuStarterToken.address, wkcsAddress], trader.address, deadline);

      balance = balance.sub(parseEther("10"));
      expect(await contracts.kuStarterToken.balanceOf(trader.address)).to.be.eq(balance);
    });

    it('users cannot claim tokens for two weeks', async function () {
      await time.increaseTime(time.week, 1);

      expect(await contracts.saleVesting.connect(user).getAvailable(user.address)).to.be.eq("0");
    });

    it('users can claim tokens after two weeks and 1 day', async function () {
      await time.increaseTime(time.week, 1);
      await time.increaseTime(time.day, 1);

      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(parseEther("379"));
      const available = await contracts.saleVesting.connect(user).getAvailable(user.address);
      expect(available).to.be.gt(parseEther("19"));

      const balance = await contracts.kuStarterToken.balanceOf(user.address);
      await contracts.saleVesting.connect(user).claimTokens(available)

      expect(await contracts.kuStarterToken.balanceOf(user.address)).to.be.eq(balance.add(available));
    });

  });
});
