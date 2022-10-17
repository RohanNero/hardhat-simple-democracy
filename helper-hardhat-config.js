const developmentChains = ["hardhat", "localhost"]

const networkConfig = {
   31337: {
      name: "localhost",
      gasLane:
         "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
      subId: "1",
      callbackGasLimit: "500000",
   },
   5: {
      name: "goerli",
      vrfCoordinator: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
      gasLane:
         "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
      subId: 7,
      callbackGasLimit: "500000",
   },
}

module.exports = {
   developmentChains,
   networkConfig,
}
