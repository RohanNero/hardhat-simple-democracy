# Simple Democracy

### This is an example of democracy with a timed election period and public voting

made possible by solidity and the EVM

---

Steps to building

1. create election period and set terms for winners. (terms will probably last for 7 days)
2. have function to vote on ending current term early to start election period again (use chainlink keepers to check if this has been voted on)
3. have a function accessible only to the current winner of the election. ( motivation to win election)
4. have a public function callable by anyone once voting period has ended, this function chooses the winner with most votes
   (may use chainlink keepers for this too instead)

hardhat dev dependencies:

```
yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv
```

### Contract addresses:

**Avalanche Fuji:** `0x8BE00b196e39B3664dbA8A2A460BFceE4b69D974`

**Ethereum Goerli:** `0x47ab2208873eD4b9FF2cA60CbfD2942736016D18`

left off notes

-  need to import chainlink automation (formerly keepers)
-  also need to add mock automation contract to mock performUpkeep()
-  also need to start unit tests

-  need to add function for users to change their favorite number
-  need to use VRF for campaign tie breakers
-  want to change logic to get rid of `isLeader() mapping`,
   it can be replaced by checking the current leader's address
   with the `leaderArray[leaderArray.length].addr`
