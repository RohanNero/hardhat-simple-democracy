const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config.js")

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async function ({ deployments, getNamedAccounts }) {
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId = network.config.chainId
   if (developmentChains.includes(network.name)) {
      const vrfCoordiantorV2Mock = await deploy("VRFCoordinatorV2Mock", {
         from: deployer,
         args: [BASE_FEE, GAS_PRICE_LINK],
         log: true,
         waitConfirmations: network.config.blockConfirmations || 1,
      })
   }
}

module.exports.tags = ["all", "mocks"]
