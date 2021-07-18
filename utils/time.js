class TimeUtil {
  // All time in seconds cause Ethereum
  minute = 60;
  hour = this.minute * 60;
  day = this.hour * 24;
  week = this.day * 7;
  roughMonth = this.day * 30;
  roughYear = this.roughMonth * 12;

  constructor(ethers) {
    this.ethers = ethers;
  }

  async increaseTime(timeSpan, number) {
    await this.ethers.provider.send("evm_increaseTime", [timeSpan * number]);
    await this.ethers.provider.send("evm_mine");
  }

  async getBlockchainTime() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 15;
  }
}

module.exports = TimeUtil;
