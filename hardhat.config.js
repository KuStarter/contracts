require('dotenv').config();
require("@nomiclabs/hardhat-waffle");


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
