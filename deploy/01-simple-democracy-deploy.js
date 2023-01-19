const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = "1000000000000000000000"

module.exports = async function ({ deployments, getNamedAccounts }) {
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId = network.config.chainId
   // Simple Democracy constructor args
   const favoriteNum = 7
   const isMale = true
   let vrfCoordinatorV2Address, subId
   if (developmentChains.includes(network.name)) {
      // need to create and fund subscritpion for VRF if on dev chain
      const vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock")
      vrfCoordinatorV2Address = vrfCoordinator.address
      const createSubTx = await vrfCoordinator.createSubscription()
      const txReceipt = await createSubTx.wait(1)
      subId = await txReceipt.events[0].args.subId
      //console.log("subId:", subId.toString())
      //console.log("vrfCoordinator:", vrfCoordinatorV2Address)
      await vrfCoordinator.fundSubscription(subId, FUND_AMOUNT)
   } else {
      subId = networkConfig[chainId].subId
      vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinator
   }

   // Defining constructor arguments to deploy contract with
   const arguments = [
      favoriteNum,
      isMale,
      vrfCoordinatorV2Address,
      networkConfig[chainId].gasLane,
      subId,
      networkConfig[chainId].callbackGasLimit,
   ]

   // Deploying contract
   const simpleDemocracy = await deploy("SimpleDemocracy", {
      from: deployer,
      args: arguments,
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
   })

   // Verifying on etherscan
   if (chainId < 10 && process.env.ETHERSCAN_API_KEY) {
      await verify(simpleDemocracy.address, arguments)
   }
}

module.exports.tags = ["all", "main"]
