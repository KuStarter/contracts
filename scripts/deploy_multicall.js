module.exports = async () => {

  await hre.run('compile');

  const Multicall = await hre.ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();

  await multicall.deployed();

  console.log("Multicall deployed to:", multicall.address);
}


