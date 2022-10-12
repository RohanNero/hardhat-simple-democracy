require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("chai")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-deploy")
require("hardhat-gas-reporter")

/** @type import('hardhat/config').HardhatUserConfig */

GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
PRIVATE_KEY = process.env.PRIVATE_KEY
ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

module.exports = {
   solidity: "0.8.17",
   networks: {
      hardhat: {
         chainId: 31337,
      },
      goerli: {
         url: GOERLI_RPC_URL,
         accounts: [PRIVATE_KEY],
         chainId: 5,
         blockConfirmations: 5,
      },
   },
   namedAccounts: {
      deployer: 0,
   },
   mocha: {
      timeout: 50000,
   },
   etherscan: {
      apiKey: ETHERSCAN_API_KEY,
   },
   gasReporter: {
      enabled: true,
      currency: "USD",
      coinmarketcap: COINMARKETCAP_API_KEY,
      gasPrice: 21,
   },
}
