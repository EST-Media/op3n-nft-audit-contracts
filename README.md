# OP3N NFT

Using Hardhat Ethereum development environment

# Setup project with hardhat

1. Install hardhat `npm install --save-dev hardhat`
2. Install packages: `npm install`
3. Install shorthand: `npm i -g hardhat-shorthand` after install can run hardhat command by `hh` instead of `npx hardhat`

# Compile, deploy and verify smart contract

Get native coin for gas purpose at: 
  - [rinkeby faucet](https://faucet.rinkeby.io/)
  - [ropsten faucet](https://faucet.ropsten.be/)
  - [goerli faucet](https://faucet.goerli.mudit.blog/)
  - [kovan faucet](https://gitter.im/kovan-testnet/faucet) or [chain.link](https://kovan.chain.link/)
  - [polygon faucet](https://faucet.polygon.technology/)
  - [bsc faucet](https://testnet.binance.org/)
  - [one faucet](https://faucet.pops.one/)

Networks supported:
  - ropsten
  - goerli
  - matic
  - matic_testnet
  - bsc
  - bsc_testnet

Script env vars:
  | key                                      | description                                                                                                                                                        |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PRIVATE_KEY`                            | a mnemonic or private key of deployer's account, ignore if when deploy on hardhat local. The account should have native coin to run deploy contract scripts                     |
| `ROPSTEN_URL`, `RINKEBY_URL`, `GOERLI_URL` | network gateway, get at: [infura](https://infura.io/) [moralis](https://moralis.io/)                                                                               |
| `ETHERSCAN_API_KEY`                      | explorer api key, get at:  [etherscan](https://etherscan.io/myapikey) [bscscan](https://bscscan.com/myapikey) [polygonscan](https://polygonscan.com/myapikey)... |
| `NFTFACTORY`                   | beacon proxy factory contract address                                                                                                                              |

### Deploy contracts:

T.B.D

# Testing

`hh test`

# Useful command:
```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```