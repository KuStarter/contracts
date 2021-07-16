require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
const { task } = require('hardhat/config');
const deploy = require('./scripts/deploy');
const whitelist = require('./scripts/whitelist');

task("deploy", "Deploys the contracts")
  .addFlag(
    "y",
    "Skips any confirmations and automatically agrees to them. Use with caution!"
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
      }
    },
    kucoin_testnet: {
      url: 'https://rpc-testnet.kcc.network',
      chainId: 322,
      accounts: {
        mnemonic: process.env.SEED_PHRASE
      }
    }
  },
  mocha: {
    timeout: 60000
  }
};
