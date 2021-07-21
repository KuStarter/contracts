require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
const { task } = require('hardhat/config');
const deploy = require('./scripts/deploy');
const whitelist = require('./scripts/whitelist');
const multicallDeploy = require("./scripts/deploy_multicall")
const liquidity = require('./scripts/liquidity');

task("deploy", "Deploys the contracts")
  .addFlag(
    "y",
    "Skips any confirmations and automatically agrees to them. Use with caution!"
  )
  .addFlag(
    "s",
    "Silences stdout"
  )
  .setAction(deploy);

task("whitelist", "Add or remove addresses from the whitelist")
  .addPositionalParam(
    "action",
    `"add" or "remove"`,
    undefined,
    types.string
  )
  .addPositionalParam(
    "file",
    "The relative path to the file of addresses to perform the action on. Should be a line-delimtted file of KCC addresses",
    undefined,
    types.inputFile
  )
  .addFlag(
    "y",
    "Skips any confirmations and automatically agrees to them. Use with caution!"
  )
  .setAction(whitelist);

task("liquidity", "Add liquidity from Presale")
  .addPositionalParam(
    "amount",
    "Amount of tokens to add to liquidity",
    undefined,
    types.string
  )
  .addFlag(
    "y",
    "Skips any confirmations and automatically agrees to them. Use with caution!"
  )
  .setAction(liquidity);


task("multicall:deploy", "Deploys the multicall")
  .setAction(multicallDeploy);


  
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://rpc-mainnet.kcc.network`,
      },
      chainId: 321,
      allowUnlimitedContractSize: true
    },
    kucoin_mainnet: {
      url: 'https://rpc-mainnet.kcc.network',
      chainId: 321,
      accounts: {
        mnemonic: process.env.SEED_PHRASE
      },
      gasPrice: 3000000000 // 3 gwei
    },
    kucoin_testnet: {
      url: 'https://rpc-testnet.kcc.network',
      chainId: 322,
      accounts: {
        mnemonic: process.env.TEST_SEED_PHRASE
      },
      gasPrice: 1000000000 // 1 gwei
    }
  },
  mocha: {
    timeout: 60000
  }
};
