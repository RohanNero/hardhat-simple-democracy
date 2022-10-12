const { ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
   ? describe.skip
   : describe("Simple Democracy Unit Tests", function () {
        let democracyFactory, simpleDemocracy, deployer, user1, user2
        beforeEach(async function () {
           ;[deployer, user1, user2] = await ethers.getSigners()
           democracyFactory = await ethers.getContractFactory(
              "SimpleDemocracy",
              deployer
           )
           simpleDemocracy = await democracyFactory.deploy(7, true)
           // console.log(`simpleDemo addr: ${simpleDemocracy.address}`);
        })
        describe("onlyCitizen", function() {
         it("modifier only allows citizens to call functions", async function() {
            await expect(simpleDemocracy.connect(user1).startRevolution()).to.be.revertedWith("SimpleDemocracy__MustBeACitizen()")
         })
        })
        describe("constructor", function () {
           it("inits deployer as first citizen", async function () {
              const firstCitizen = await simpleDemocracy.citizenArray(0)
              assert.equal(firstCitizen.toString(), [
                 deployer.address,
                 7,
                 0,
                 0,
                 true,
              ])
           })
           it("inits deployer as first leader", async function () {
              const firstLeader = await simpleDemocracy.leaderArray(0)
              assert.equal(firstLeader.toString(), [
                 deployer.address,
                 7,
                 0,
                 0,
                 true,
              ])
           })
        })
        describe("becomeCitizen", function () {
           it("reverts if msg.sender is already a citizen", async function () {
              await expect(
                 simpleDemocracy.becomeCitizen(7, true)
              ).to.be.revertedWith("SimpleDemocracy__AlreadyACitizen(0)")
           })
           it("adds msg.sender to the citizenArray", async function () {
              await simpleDemocracy.connect(user1).becomeCitizen(420, true)
              const value = await simpleDemocracy.citizenArray(1)
              assert.equal(value.toString(), [user1.address, 420, 1, 0, true])
           })
           it("adds msg.sender to the citizenMapping", async function () {
              await simpleDemocracy.connect(user2).becomeCitizen(77, false)
              const value = await simpleDemocracy.citizenMapping(user2.address)
              assert.equal(value.toString(), [user2.address, 77, 1, 0, false])
           })
           it("emits the CitizenJoined event", async function () {
              await expect(
                 simpleDemocracy.connect(user1).becomeCitizen(777, true)
              )
                 .to.emit(simpleDemocracy, "CitizenJoined")
                 .withArgs(user1.address, 777, true)
           })
           it("returns the new citizen's Id", async function () {
              const id = await simpleDemocracy
                 .connect(user1)
                 .callStatic.becomeCitizen(7, false)
              assert.equal(id.toString(), "1")
           })
        })
        describe("campaignForLeader", function () {
           beforeEach(async function () {
              await simpleDemocracy.connect(user1).becomeCitizen(420, true)
              await simpleDemocracy.performUpkeep([])
              await simpleDemocracy.connect(user2).becomeCitizen(777, false)
              await simpleDemocracy.performUpkeep([])
              await simpleDemocracy.performUpkeep([])
           })
           it("reverts if status isnt anarchy", async function () {
              await expect(
                 simpleDemocracy.campaignForLeader()
              ).to.be.revertedWith("SimpleDemocracy__StatusMustBeAnarchy()")
           })
           it("reverts if msg.sender hasn't been a citizen for 3 weeks", async function () {
              await simpleDemocracy.startRevolution()
              await expect(
                 simpleDemocracy.connect(user2).campaignForLeader()
              ).to.be.revertedWith("SimpleDemocracy__NewCitizensCantBeLeader()")
           })
           it("reverts if msg.sender was the previous leader", async function () {
              await simpleDemocracy.startRevolution()
              await expect(
                 simpleDemocracy.campaignForLeader()
              ).to.be.revertedWith("SimpleDemocracy__YouCausedThisChaos()")
           })
        })
        describe("voteForLeader", function () {
         beforeEach(async function() {
            await simpleDemocracy.connect(user1).becomeCitizen(420, true)
            await simpleDemocracy.connect(user2).becomeCitizen(777, true)
            await simpleDemocracy.performUpkeep("0x")
            await simpleDemocracy.performUpkeep("0x")
            await simpleDemocracy.performUpkeep("0x")
            await simpleDemocracy.startRevolution()
            await simpleDemocracy.connect(user1).campaignForLeader()
         })
         it("reverts if user has already voted for a campaign", async function() {
            await simpleDemocracy.voteForLeader(0)
            await expect(simpleDemocracy.voteForLeader(0)).to.be.revertedWith("SimpleDemocracy__AlreadyVoted()")
         })
         it("increments the number of votes a campaign has correctly", async function() {
            const [,,initialCount] = await simpleDemocracy.leaderIdToCampaignArray(1, 0)
            await simpleDemocracy.voteForLeader(0)
            const [,,finalCount] = await simpleDemocracy.leaderIdToCampaignArray(1,0)
            assert.equal((initialCount.add(1)).toString(), finalCount.toString())
         })
        })
        describe("startRevolution", function () {
         beforeEach(async function() {
            await simpleDemocracy.connect(user1).becomeCitizen(420, true)
            await simpleDemocracy.connect(user2).becomeCitizen(77, false)
            await simpleDemocracy.performUpkeep("0x")
            await simpleDemocracy.performUpkeep("0x")
            await simpleDemocracy.performUpkeep("0x")
         })
         it("reverts if status is already anarchy", async function() {
            await simpleDemocracy.startRevolution()
            await expect(simpleDemocracy.startRevolution()).to.be.revertedWith("SimpleDemocracy__StatusMustBePeaceful()")
         })
         it("emits leaderOverthrown if the leader calls", async function() {
            await expect(simpleDemocracy.startRevolution()).to.emit(simpleDemocracy, "LeaderOverthrown").withArgs(deployer.address, 3)
         })
         it("reverts if user has already called the function", async function() {
            await simpleDemocracy.connect(user1).startRevolution()
            await expect(simpleDemocracy.connect(user1).startRevolution()).to.be.revertedWith("SimpleDemocracy__AlreadyJoinedUprising()")
         })
         it("emits leaderOverthrown if rebelCounter > citizenArray.length / 2", async function() {
            await simpleDemocracy.connect(user1).startRevolution()
            await expect(simpleDemocracy.connect(user2).startRevolution()).to.emit(simpleDemocracy, "LeaderOverthrown").withArgs(deployer.address, 3)
         })
        })
        describe("checkUpkeep", function () {
           beforeEach(async function () {
              await simpleDemocracy.connect(user1).becomeCitizen(420, true)
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
           })
           it("returns false if status is anarchy and no users campaignedForLeader", async function () {
              await simpleDemocracy.startRevolution()
              const [expectedVal] = await simpleDemocracy.checkUpkeep("0x")
              //console.log(expectedVal)
              assert.equal(expectedVal, false)
           })
           it("returns true if status is anarchy and atleast one user has campaignedForLeader", async function () {
              await simpleDemocracy.startRevolution()
              await simpleDemocracy.connect(user1).campaignForLeader()
              const [expectedVal] = await simpleDemocracy.checkUpkeep("0x")
              //console.log(expectedVal)
              assert.equal(expectedVal, true)
           })
           it("returns true if status is peaceful", async function () {
              const [expectedVal] = await simpleDemocracy.checkUpkeep("0x")
              //console.log(expectedVal)
              assert.equal(expectedVal, true)
           })
        })
        describe("performUpkeep", function () {
           beforeEach(async function () {
              await simpleDemocracy.connect(user1).becomeCitizen(777, true)
              await simpleDemocracy.connect(user2).becomeCitizen(77, false)
           })
           it("increments leader's weeksAsLeader if status is peaceful", async function () {
              const aVar = await simpleDemocracy.leaderArray(0)
              const initVal = await aVar.weeksAsLeader
              //console.log(`initVal: ${initVal.toString()}`)
              await simpleDemocracy.performUpkeep([])
              const bVar = await simpleDemocracy.leaderArray(0)
              const finalVal = await bVar.weeksAsLeader
              //console.log(`finalVal: ${finalVal.toString()}`)
              assert.equal(initVal.add(1).toString(), finalVal.toString())
           })
           it("increments citizen's weeksAsCitizen if status is peaceful", async function () {
              const aVar = await simpleDemocracy.citizenArray(1)
              const initVal = aVar.weeksAsCitizen
              //console.log(`initVal: ${initVal.toString()}`)
              await simpleDemocracy.performUpkeep("0x")
              const bVar = await simpleDemocracy.citizenArray(1)
              const finalVal = await bVar.weeksAsCitizen
              //console.log(`finalVal: ${finalVal.toString()}`)
              assert.equal(initVal.add(1).toString(), finalVal.toString())
           })
           it("updates struct in citizenMapping if status is peaceful", async function () {
              const [, , , initVal] = await simpleDemocracy.citizenMapping(
                 deployer.address
              )
              await simpleDemocracy.performUpkeep("0x")
              const [, , , finalVal] = await simpleDemocracy.citizenMapping(
                 deployer.address
              )
              assert.equal(initVal.add(1).toString(), finalVal.toString())
           })
           it("emits CivilizationAtPeace event if status is peaceful", async function () {
              await expect(simpleDemocracy.performUpkeep("0x"))
                 .to.emit(simpleDemocracy, "CivilizationAtPeace")
                 .withArgs(deployer.address, 1)
           })
           it("makes campaign with the highest votes the new leader", async function () {
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.startRevolution()
              await simpleDemocracy.connect(user1).campaignForLeader()
              await simpleDemocracy.connect(user2).campaignForLeader()
              await simpleDemocracy.voteForLeader(1)
              await simpleDemocracy.connect(user1).voteForLeader(0)
              await simpleDemocracy.connect(user2).voteForLeader(1)
              await simpleDemocracy.performUpkeep("0x")
              const expectedValue = await simpleDemocracy.leaderArray(1)
              assert.equal(expectedValue.toString(), [
                 user2.address,
                 "77",
                 "1",
                 "0",
                 "false",
              ])
           })
           it("emits the NewLeaderElected event correctly", async function () {
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.startRevolution()
              await simpleDemocracy.connect(user2).campaignForLeader()
              await simpleDemocracy.voteForLeader(0)
              await simpleDemocracy.connect(user2).voteForLeader(0)
              await expect(simpleDemocracy.performUpkeep("0x"))
                 .to.emit(simpleDemocracy, "NewLeaderElected")
                 .withArgs(user2.address, 2)
           })
           it("emits VRFChoosingNewLeader event if multiple campaigns tie", async function () {
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.performUpkeep("0x")
              await simpleDemocracy.startRevolution()
              await simpleDemocracy.connect(user1).campaignForLeader()
              await simpleDemocracy.connect(user2).campaignForLeader()
              await simpleDemocracy.voteForLeader(0)
              await simpleDemocracy.connect(user1).voteForLeader(1)
              await expect(simpleDemocracy.performUpkeep("0x"))
                 .to.emit(simpleDemocracy, "VRFChoosingNewLeader")
                 .withArgs(2)
           })
        })
        describe("getStatus", function () {
         it("returns peaceful correctly", async function() {
            const value = await simpleDemocracy.getStatus()
            //console.log(value.toString())
         })
         it("returns anarchy correctly", async function() {
            const value = await simpleDemocracy.getStatus()
            //console.log(value.toString())
         })
        })
        describe("getLeaderArrayLength", function() {
         it("should return length of the leaderArray correctly", async function() {
            const initialCount = await simpleDemocracy.getLeaderArrayLength()
            await simpleDemocracy.startRevolution()
            const finalCount = await simpleDemocracy.getLeaderArrayLength() 
         })
                
        })
     })
