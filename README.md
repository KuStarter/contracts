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

**Important Transactions**:
 - Tx for deploying DAOFundTimelock with lock of 7 days mined with hash https://explorer.kcc.io/en/tx/0xbc0396ea61d9a28bb3ab1a7edc717fbd3e01ff5dea9029f08f62c255d3b7bfc0
 - Tx for deploying StakingRewardsTimelock with lock of 4 days mined with hash https://explorer.kcc.io/en/tx/0x9125706e6fe0401a57f954b781ed3cb9da0ad87eb4c1a9721058b94fbaff95f8
 - Tx for deploying LPMiningRewardsTimelock with lock of 4 days mined with hash https://explorer.kcc.io/en/tx/0x5139e9304972f65a643f51e912ab3dc171c9dcc35a9d794881f642c428b1292b
 - Tx for deploying KuStarter Token mined with hash https://explorer.kcc.io/en/tx/0xdfd295fcfe48f2a2b1299cb626323bb14a46585c99403cadf924c156d4938255
 - Tx for adding tokens to Sale Vesting contract mined with hash https://explorer.kcc.io/en/tx/0x95640340d001969c0d6c66e23875077a8a75d98b38de34a5e1574cd2a2f4c751
 - Tx for adding tokens to Marketing Vesting contract mined with hash https://explorer.kcc.io/en/tx/0xd0730990ae5d296ba5a5e9903eb6631a0ec6aceb19e104b840a33e0e764ccf69
 - Tx for adding tokens to Development Vesting 1 contract mined with hash https://explorer.kcc.io/en/tx/0xff9dd3f62de25056f5dc0c16ca66fa85af5b2a737bb616d0077d039c474ca4f9
 - Tx for adding tokens to Development Vesting 2 contract mined with hash https://explorer.kcc.io/en/tx/0x90e3e6e2b1eb3ad96905e37da6d737519c4aa0440371b92a6eaf4c2ef2d91d69
 - Tx for adding tokens to Development Vesting 2 contract mined with hash https://explorer.kcc.io/en/tx/0x6b80212208753ab03a03efd347ac6292e3b2a21bc21f95486d79bfa73170df3b

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
