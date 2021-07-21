# KuStarter $KUST 🚀
[<img src="logo.png" alt="KuStarter" height="200px">](http://kustarter.com)
  

A new and innovative launchpad for projects on the [KuCoin Community Chain](kcc.io).

## Prerequisites

NodeJS & Yarn.  

If you use [nvm](https://github.com/nvm-sh/nvm) (which you should), first run `nvm use`, then `npm install -g yarn`.  

Copy `.env.example` to `.env` and fill it as required.

### Run Tests

```
yarn install
yarn run test
```

### Deploy Contracts

```
yarn run deploy
```

#### Deployed Addresses

| Contract                   | Contract address |
|----------------------------|------------------|
| DAOFundTimelock            | [0xa0C5343f94BcF3324023Bb0bB27b164972d9fc0a](https://explorer.kcc.io/en/address/0xa0C5343f94BcF3324023Bb0bB27b164972d9fc0a) |
| StakingRewardsTimelock     | [0x9b2195bFD2B37C44383786328dD865264F56A022](https://explorer.kcc.io/en/address/0x9b2195bFD2B37C44383786328dD865264F56A022) |
| LPMiningRewardsTimelock    | [0x06a21B730c626A9E4F4966c107e74EE833Ac3C82](https://explorer.kcc.io/en/address/0x06a21B730c626A9E4F4966c107e74EE833Ac3C82) |
| Presale                    | [0x5AcdeAe0b2CaaF6eA18a576048BBf13E0d2C8819](https://explorer.kcc.io/en/address/0x5AcdeAe0b2CaaF6eA18a576048BBf13E0d2C8819) |
| KuStarterToken             | [0x204dFE63C672886b09Df4164F4d39c6Db87d10B1](https://explorer.kcc.io/en/address/0x204dFE63C672886b09Df4164F4d39c6Db87d10B1) |
| SaleVesting                | [0x961A320b0367dfe6634C2e678cf94F7fb6b3267B](https://explorer.kcc.io/en/address/0x961A320b0367dfe6634C2e678cf94F7fb6b3267B) |
| MarketingVesting           | [0xfb701b994C8FE2Ee20C7E158Ca9196778445051F](https://explorer.kcc.io/en/address/0xfb701b994C8FE2Ee20C7E158Ca9196778445051F) |
| DevelopmentVesting1        | [0x95FA0cC58D376B6E50Ac4BA02f27a149Da33aAEF](https://explorer.kcc.io/en/address/0x95FA0cC58D376B6E50Ac4BA02f27a149Da33aAEF) |
| DevelopmentVesting2        | [0x4482748Fec1F2Efb6Ab9d04c53cfa9cFa9f12Ffd](https://explorer.kcc.io/en/address/0x4482748Fec1F2Efb6Ab9d04c53cfa9cFa9f12Ffd) |


### Directory Structure

    .
    ├── .vscode                 # Project setup to work with VS Code nicely
    ├── contracts               # Contracts for KuStarter
    │   └── test                # Contracts only used for tests, never deployed to production
    ├── scripts                 # Hardhat scripts (e.g. deployments)
    ├── test                    # Automated tests
    ├── utls                    # Miscellaneous utility files
    ├── .env.example            # env vars
    ├── .nvmrc                  # used by nvm to easily use required node version
    ├── hardhat.config.js       # Hardhat config with KCC networks setup
    ├── LICENSE
    ├── package.json            # The usual for Yarn
    └── README.md

#### Koffeeswap Resources

`utils/KoffeeSwapRouter.abi.json` taken from https://github.com/KoffeeSwap/koffeeswap-contracts as there is no NPM package
