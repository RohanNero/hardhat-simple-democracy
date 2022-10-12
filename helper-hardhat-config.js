const developmentChains = ["hardhat", "localhost"];

const networkConfig = {
  31337: {
    name: "hardhat",
  },
  5: {
    name: "goerli",
  },
};

module.exports = {
  developmentChains,
  networkConfig,
};
