const hre = require("hardhat");
const yesno = require("yesno");

async function main() {
  let ok = await yesno({ question: `Are you sure you want to deploy on ${hre.network.name} (y/n)?` });
  if(!ok) {
    return;
  }

  // Deploy $KUST token, mint funds to Treasury and DAO fund
  // Deploy Presale
  // Deploy Vesting
  // Init Presale with Vesting address and private sale details

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
