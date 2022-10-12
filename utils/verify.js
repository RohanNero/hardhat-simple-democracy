const { run } = require("hardhat")

const verify = async function (contractAddress, args) {
   console.log("verifying contract...")
   try {
      await hre.run("verify:verify", {
         address: contractAddress,
         constructorArguments: args,
      })
   } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
         console.log("Already verified!")
      } else {
         console.log(error)
      }
   }
}

module.exports = {
   verify,
}
