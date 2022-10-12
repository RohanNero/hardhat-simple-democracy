const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ deployments, getNamedAccounts }) {
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()
   const arguments = [7, true]
   const simpleDemocracy = await deploy("SimpleDemocracy", {
      from: deployer,
      args: arguments,
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
   })

   if (
      !developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
   ) {
      await verify(simpleDemocracy.address, arguments)
   }
}
