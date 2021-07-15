// All time in seconds cause Ethereum

const minute = 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
const roughMonth = day * 30;
const roughYear = roughMonth * 12;


const getTime = function () {
  return Math.floor(new Date().getTime() / 1000);
};

const increaseTime = async function (timeSpan, number, ethers) {
  await ethers.provider.send('evm_increaseTime', [timeSpan * number]);
  await ethers.provider.send('evm_mine');
};

module.exports = { minute, hour, day, week, roughMonth, roughYear, getTime, increaseTime };