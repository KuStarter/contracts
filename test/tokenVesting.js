const { expect } = require('chai');
const parseEther = ethers.utils.parseEther;

describe('TokenVesting', function () {
  let erc20, tokenVesting, deployTime, treasury, user1, user2, user3, user4, renouncer, attacker;

  // rough year, note these do not need to be accurate
  const minute = 60;
  const hour = minute * 60;
  const roughDay = hour * 24;
  const roughMonth = roughDay * 30;
  const roughYear = roughMonth * 12;

  // keep track of the amount by which the internal evm is out of sync with current date
  let incrementedTime = 0;
  const getLocalTime = function () {
    const now = Math.floor(new Date().getTime() / 1000);
    return now + incrementedTime;
  };

  const increaseTime = async function (timeSpan, number) {
    const toIncrememt = timeSpan * number;
    incrementedTime += toIncrememt;
    await network.provider.send('evm_increaseTime', [toIncrememt]);
    await network.provider.send('evm_mine');
  };

  const deployVesting = async function (increment = 0) {
    const TokenVesting = await ethers.getContractFactory('TokenVesting');
    deployTime = getLocalTime() + increment;
    return await TokenVesting.deploy(treasury.address, treasury.address, deployTime, erc20.address);
  };

  before(async function () {
    [treasury, user1, user2, user3, user4, renouncer, attacker] = await ethers.getSigners();
    const Erc20 = await ethers.getContractFactory('ExampleErc20');
    erc20 = await Erc20.deploy(parseEther('100000'));
  });

  describe('Tests starting vesting immediately', function () {
    describe('core functionality, single-claim scenario', function () {
      before(async function () {
        tokenVesting = await deployVesting();
        await erc20.connect(treasury).approve(tokenVesting.address, parseEther('1'));
        await tokenVesting.connect(treasury).deposit(parseEther('1'));
        await tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, parseEther('1'), 0);
      });

      it('token balance should be 0, and claimable should be 0', async function () {
        expect(await erc20.balanceOf(user1.address)).to.be.eq(parseEther('0'));
        expect(await tokenVesting.getAvailable(user1.address)).to.be.eq(parseEther('0'));
      });

      it('claimable should incrementally fill', async function () {
        await increaseTime(minute, 20);
        expect(await tokenVesting.getAvailable(user1.address)).to.be.gt(parseEther('0.2'));
      });

      it('claimable should approach 1eth, slightly less due to time math', async function () {
        await increaseTime(minute, 40);
        expect(await tokenVesting.getAvailable(user1.address)).to.be.gt(parseEther('0.995'));
      });

      it('claiming entire balance should transfer', async function () {
        await increaseTime(minute, 1);
        const toClaim = await tokenVesting.getAvailable(user1.address);
        await tokenVesting.connect(user1).claimTokens(toClaim);
        expect(await erc20.balanceOf(user1.address)).to.be.eq(parseEther('1'));
      });

      it('user should now have no more available tokens', async function () {
        expect(await tokenVesting.getAvailable(user1.address)).to.be.eq('0');
      });

      it('user should no longer be able to claim', async function () {
        await increaseTime(hour, 1);
        await expect(tokenVesting.connect(user1).claimTokens('1')).to.be.revertedWith('Balance not sufficient');
      });
    });

    describe('core functionality, single-claim scenario, initial 20%', function () {
      before(async function () {
        tokenVesting = await deployVesting();
        await erc20.connect(treasury).approve(tokenVesting.address, parseEther('1'));
        await tokenVesting.connect(treasury).deposit(parseEther('1'));
        await tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, parseEther('1'), 20);
      });

      it('token balance should so far be 1.2 eth, and claimable should be 0', async function () {
        expect(await erc20.balanceOf(user1.address)).to.be.eq(parseEther('1.2'));
        expect(await tokenVesting.getAvailable(user1.address)).to.be.eq(parseEther('0'));
      });

      it('claimable should incrementally fill', async function () {
        await increaseTime(minute, 20);
        expect(await tokenVesting.getAvailable(user1.address)).to.be.gt(parseEther('0.25'));
      });

      it('claimable balance should approach 0.8eth, slightly less due to time math', async function () {
        await increaseTime(minute, 40);
        expect(await tokenVesting.getAvailable(user1.address)).to.be.gt(parseEther('0.79'));
      });

      it('claiming entire balance should transfer', async function () {
        await increaseTime(minute, 1);
        const toClaim = await tokenVesting.getAvailable(user1.address);
        await tokenVesting.connect(user1).claimTokens(toClaim);
        expect(await erc20.balanceOf(user1.address)).to.be.eq(parseEther('2'));
      });

      it('user should now have no more available tokens', async function () {
        expect(await tokenVesting.getAvailable(user1.address)).to.be.eq('0');
      });

      it('user should no longer be able to claim', async function () {
        await increaseTime(hour, 1);
        await expect(tokenVesting.connect(user1).claimTokens('1')).to.be.revertedWith('Balance not sufficient');
      });
    });

    describe('core functionality, multi-claim scenario over a year', function () {
      before(async function () {
        tokenVesting = await deployVesting();
        await erc20.connect(treasury).approve(tokenVesting.address, parseEther('60'));
        await tokenVesting.connect(treasury).deposit(parseEther('60'));
        await tokenVesting.connect(treasury).submit(user2.address, deployTime + roughYear, parseEther('60'), 0);
      });

      it('claimable should be 0', async function () {
        expect(await tokenVesting.getAvailable(user2.address)).to.be.eq(parseEther('0'));
      });

      it('token balance should incrementally fill over 2 months', async function () {
        await increaseTime(roughMonth, 2);

        expect(await tokenVesting.getAvailable(user2.address)).to.be.within(parseEther('9.9'), parseEther('10.1'));
      });

      it('claiming entire balance should transfer', async function () {
        await tokenVesting.connect(user2).claimTokens(parseEther('5'));
        expect(await erc20.balanceOf(user2.address)).to.be.eq(parseEther('5'));
        expect(await tokenVesting.getAvailable(user2.address)).to.be.within(parseEther('4.9'), parseEther('5.1'));
      });

      it('token balance should incrementally fill over another 10 months', async function () {
        await increaseTime(roughMonth, 10);
        expect(await tokenVesting.getAvailable(user2.address)).to.be.within(parseEther('54.9'), parseEther('55'));
      });

      it('claiming entire balance should transfer, ensure user afterwards is zero', async function () {
        await increaseTime(roughMonth, 1);
        await tokenVesting.connect(user2).claimTokens(parseEther('54.99'));
        expect(await erc20.balanceOf(user2.address)).to.be.gt(parseEther('55.9'));
      });

      it('user should now have no more available tokens', async function () {
        expect(await tokenVesting.getAvailable(user2.address)).to.be.lt(parseEther('0.1'));
      });

      it('user should no longer be able to claim', async function () {
        await increaseTime(roughMonth, 12);
        await expect(tokenVesting.connect(user2).claimTokens(parseEther('0.1'))).to.be.revertedWith(
          'Balance not sufficient'
        );
      });
    });

    describe('core functionality, claim with renounce', function () {
      before(async function () {
        tokenVesting = await deployVesting();
        await erc20.connect(treasury).approve(tokenVesting.address, parseEther('1'));
        await tokenVesting.connect(treasury).deposit(parseEther('1'));
        await tokenVesting.connect(treasury).submit(user3.address, deployTime + 3600, parseEther('1'), '0');
      });

      it('token balance should so far be negligible', async function () {
        expect(await tokenVesting.getAvailable(user3.address)).to.be.lt(parseEther('0.01'));
      });

      it('token balance should incrementally fill', async function () {
        await increaseTime(minute, 20);
        expect(await tokenVesting.getAvailable(user3.address)).to.be.gt(parseEther('0.2'));
      });

      it('claiming entire balance should transfer, ensure user afterwards is zero', async function () {
        const toClaim = await tokenVesting.getAvailable(user3.address);
        await tokenVesting.connect(user3).claimTokens(toClaim);
        expect(await erc20.balanceOf(user3.address)).to.be.eq(toClaim);
      });

      it('user should be able to renounce', async function () {
        await tokenVesting.connect(user3).renounce();
      });

      it('user should no longer be able to claim', async function () {
        await increaseTime(hour, 1);
        await expect(tokenVesting.connect(user3).claimTokens('1')).to.be.revertedWith('Not a contributor');
      });
    });

    describe('treasury only', function () {
      before(async function () {
        tokenVesting = await deployVesting();
      });

      it('treasury should be able to update treasury', async function () {
        tokenVesting.connect(treasury).updateTreasury(user3.address);
      });
    });

    describe('fuzzy attack scenarios', function () {
      before(async function () {
        tokenVesting = await deployVesting();
      });

      it('incorrect _amount parameter', async function () {
        await expect(tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, 0, 0)).to.be.revertedWith('_amount must be set greater than 0');
      });

      it('incorrect _receiver parameter', async function () {
        await tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, 1, 0);
        await expect(tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, 1, 0)).to.be.revertedWith('Claim already exists for this _receiver address');
      });

      it('incorrect _initialPercentage parameter', async function () {
        await expect(tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, parseEther('1'), 100)).to.be.revertedWith('_initialPercentage must be a number between 0 and 99');
        await expect(tokenVesting.connect(treasury).submit(user1.address, deployTime + 3600, parseEther('1'), 500)).to.be.revertedWith('_initialPercentage must be a number between 0 and 99');
      });
    });

    describe('attack scenarios', function () {
      before(async function () {
        tokenVesting = await deployVesting();
      });

      it('attacker should not be able to submit allocation', async function () {
        await expect(
          tokenVesting.connect(attacker).submit(user3.address, deployTime + 3600, parseEther('1'), 0)
        ).to.be.revertedWith('Not presale');
      });

      it('attacker should not be able to update treasury', async function () {
        await expect(tokenVesting.connect(attacker).updateTreasury(user3.address)).to.be.revertedWith('Not treasury');
      });

      it('attacker should not be able to renounce', async function () {
        await expect(tokenVesting.connect(attacker).renounce()).to.be.revertedWith('Not a contributor');
      });
    });
  });

  describe('Future vesting', function () {
    describe('core functionality, single-claim scenario, but vesting starts in 2 weeks', function () {
      before(async function () {
        tokenVesting = await deployVesting(roughDay * 14);
        await erc20.connect(treasury).approve(tokenVesting.address, parseEther('1'));
        await tokenVesting.connect(treasury).deposit(parseEther('1'));
        await tokenVesting.connect(treasury).submit(user4.address, deployTime + 3600, parseEther('1'), 0);
      });

      it('token balance should be 0, and claimable should be 0', async function () {
        expect(await erc20.balanceOf(user4.address)).to.be.eq(parseEther('0'));
        expect(await tokenVesting.getAvailable(user4.address)).to.be.eq(parseEther('0'));
      });

      it('even after 1 hour, nothing should be different', async function () {
        await increaseTime(hour, 1);
        expect(await erc20.balanceOf(user4.address)).to.be.eq(parseEther('0'));
        expect(await tokenVesting.getAvailable(user4.address)).to.be.eq(parseEther('0'));
      });

      it('claimable should incrementally fill after initial 2 weeks', async function () {
        await increaseTime(hour, 23); // needed because of the hour from above
        await increaseTime(roughDay, 13);

        await increaseTime(minute, 20);
        expect(await tokenVesting.getAvailable(user4.address)).to.be.gt(parseEther('0.2'));
      });

      it('claimable should approach 1eth, slightly less due to time math', async function () {
        await increaseTime(minute, 40);
        expect(await tokenVesting.getAvailable(user4.address)).to.be.gt(parseEther('0.995'));
      });

      it('claiming entire balance should transfer', async function () {
        await increaseTime(minute, 1);
        const toClaim = await tokenVesting.getAvailable(user4.address);
        await tokenVesting.connect(user4).claimTokens(toClaim);
        expect(await erc20.balanceOf(user4.address)).to.be.eq(parseEther('1'));
      });

      it('user should now have no more available tokens', async function () {
        expect(await tokenVesting.getAvailable(user4.address)).to.be.eq('0');
      });

      it('user should no longer be able to claim', async function () {
        await increaseTime(hour, 1);
        await expect(tokenVesting.connect(user4).claimTokens('1')).to.be.revertedWith('Balance not sufficient');
      });
    });

    describe('core functionality, single-claim scenario, initial 20%', function () {
      before(async function () {
        tokenVesting = await deployVesting(roughDay * 14);
        await erc20.connect(treasury).approve(tokenVesting.address, parseEther('1'));
        await tokenVesting.connect(treasury).deposit(parseEther('1'));
        await tokenVesting.connect(treasury).submit(user4.address, deployTime + 3600, parseEther('1'), 20);
      });

      it('token balance should so far be 1.2 eth, and claimable should be 0', async function () {
        expect(await erc20.balanceOf(user4.address)).to.be.eq(parseEther('1.2'));
        expect(await tokenVesting.getAvailable(user4.address)).to.be.eq(parseEther('0'));
      });

      it('even after 1 hour, nothing should be different', async function () {
        await increaseTime(hour, 1);
        expect(await erc20.balanceOf(user4.address)).to.be.eq(parseEther('1.2'));
        expect(await tokenVesting.getAvailable(user4.address)).to.be.eq(parseEther('0'));
      });

      it('claimable should incrementally fill after initial 2 weeks', async function () {
        await increaseTime(hour, 23); // needed because of the hour from above
        await increaseTime(roughDay, 13);

        await increaseTime(minute, 20);
        expect(await tokenVesting.getAvailable(user4.address)).to.be.gt(parseEther('0.25'));
      });

      it('claimable balance should approach 0.8eth, slightly less due to time math', async function () {
        await increaseTime(minute, 40);
        expect(await tokenVesting.getAvailable(user4.address)).to.be.gt(parseEther('0.79'));
      });

      it('claiming entire balance should transfer', async function () {
        await increaseTime(minute, 1);
        const toClaim = await tokenVesting.getAvailable(user4.address);
        await tokenVesting.connect(user4).claimTokens(toClaim);
        expect(await erc20.balanceOf(user4.address)).to.be.eq(parseEther('2'));
      });

      it('user should now have no more available tokens', async function () {
        expect(await tokenVesting.getAvailable(user4.address)).to.be.eq('0');
      });

      it('user should no longer be able to claim', async function () {
        await increaseTime(hour, 1);
        await expect(tokenVesting.connect(user4).claimTokens('1')).to.be.revertedWith('Balance not sufficient');
      });
    });

  });
});
