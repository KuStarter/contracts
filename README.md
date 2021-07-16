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
yarn test
```

### Deploy Contracts

```
yarn run deploy
```

#### Deployed Addresses

| Contract | Contract address |
|----------|------------------|
| DAOFundTimelock          | TBC |
| StakingRewardsTimelock     | TBC |
| LPMiningRewardsTimelock    | TBC |
| Presale                    | TBC | 
| KuStarterToken             | TBC |
| SaleVesting                | TBC |
| MarketingVesting           | TBC |
| DevelopmentVesting1        | TBC | 
| DevelopmentVesting2        | TBC | 


### Directory Structure

    .
    ├── .vscode                 # Project setup to work with VS Code nicely
    ├── contracts               # Contracts for KuStarter
    │   └── test                # Contracts only used for tests, never deployed to production
    ├── scripts                 # Hardhat scripts (e.g. deployments)
    ├── test                    # Automated tests
    ├── .env.example            # env vars
    ├── .nvmrc                  # used by nvm to easily use required node version
    ├── hardhat.config.js       # Hardhat config with KCC networks setup
    ├── LICENSE
    ├── package.json            # The usual for Yarn
    └── README.md

