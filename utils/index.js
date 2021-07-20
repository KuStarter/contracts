const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const checkEnvVars = (...envVars) => {
  return envVars.every(envVar => {
    if (!process.env[envVar]) {
      console.warn(`${envVar} not set.`);
      return false;
    }
    return true;
  });
};

const computeKoffeeSwapPairAddress = (factoryAddress, tokenA, tokenB, ethers) => {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

  return ethers.utils.getCreate2Address(
    factoryAddress,
    ethers.utils.solidityKeccak256(['bytes'], [ethers.utils.solidityPack(['address', 'address'], [token0, token1])]),
    "0x62c604a2a99a1c155ab3a06b325602ce74fbd4ea12c4fb4c4c1cffdd110d3981"
  )
}

module.exports = { sleep, checkEnvVars, computeKoffeeSwapPairAddress };
