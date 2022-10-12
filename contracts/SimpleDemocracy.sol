//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error SimpleDemocracy__MustBeACitizen();
error SimpleDemocracy__AlreadyACitizen(uint256 citizenId);
error SimpleDemocracy__YouCausedThisChaos();
error SimpleDemocracy__StatusMustBeAnarchy();
error SimpleDemocracy__StatusMustBePeaceful();
error SimpleDemocracy__AlreadyJoinedUprising();
error SimpleDemocracy__NewCitizensCantBeLeader();
error SimpleDemocracy__AlreadyVoted();
error SimpleDemocracy__UpkeepNotNeeded();

contract SimpleDemocracy is AutomationCompatible {
   enum Status {
      Peaceful, // 0
      Anarchy // 1
      //Election // 2
   }

   struct Citizen {
      address addr;
      uint256 favoriteNumber;
      uint256 citizenId;
      uint256 timeAsCitizen;
      bool isMale;
   }

   struct Leader {
      address addr;
      uint256 favoriteNumber;
      uint256 leaderId;
      uint256 timeAsLeader;
      bool isMale;
   }

   struct Campaign {
      address addr;
      uint256 campaignId;
      uint256 votes;
   }

   uint256 startingTimestamp;
   uint256 timeInterval = 60 * 60 * 24 * 7;
   uint256 rebelCounter;
   Status public status;
   Citizen[] public citizenArray;
   Leader[] public leaderArray;
   mapping(address => bool) public isCitizen;
   mapping(address => Citizen) public citizenMapping;
   // user address to leaderId to bool representing if the user has called startRevolution()
   mapping(address => mapping(uint256 => bool)) public isRebel;
   mapping(address => bool) public isLeader;
   // user address to leaderId to bool representing if the user has voted for a campaign
   mapping(address => mapping(uint256 => bool)) public hasVoted;
   mapping(uint256 => Campaign[]) public leaderIdToCampaignArray;
   /// @dev this uint[] is used with VRF to pick a winner if there is a tie
   mapping(uint256 => uint256[]) public winnerCampaignIds;

   event CitizenJoined(
      address indexed citizenAddr,
      uint256 indexed favoriteNubmer,
      bool indexed isMale
   );
   event LeaderOverthrown(
      address indexed leader,
      uint256 indexed timeAsLeader
   );
   event CivilizationAtPeace(
      address indexed currentLeader,
      uint256 indexed timeAsLeader
   );
   event NewLeaderElected(address indexed newLeader, uint256 numberOfVotes);
   event VRFChoosingNewLeader(uint256 numberOfWinningCampaigns);

   modifier onlyCitizen() {
      if (isCitizen[msg.sender] == false) {
         revert SimpleDemocracy__MustBeACitizen();
      }
      //require(isCitizen[msg.sender] == true);
      _;
   }

   constructor(uint256 favoriteNumber, bool isMale) {
      citizenArray.push(
         Citizen({
            addr: msg.sender,
            favoriteNumber: favoriteNumber,
            citizenId: citizenArray.length,
            timeAsCitizen: 0,
            isMale: isMale
         })
      );
      isCitizen[msg.sender] = true;
      leaderArray.push(
         Leader({
            addr: msg.sender,
            favoriteNumber: favoriteNumber,
            leaderId: leaderArray.length,
            timeAsLeader: 0,
            isMale: isMale
         })
      );
      isLeader[msg.sender] = true;
      startingTimestamp = block.timestamp;
   }

   function becomeCitizen(uint256 favoriteNumber, bool isMale)
      public
      returns (uint256 citizenId)
   {
      if (isCitizen[msg.sender] == true) {
         revert SimpleDemocracy__AlreadyACitizen(
            citizenMapping[msg.sender].citizenId
         );
      }
      isCitizen[msg.sender] = true;
      Citizen memory newCitizen = Citizen({
         addr: msg.sender,
         favoriteNumber: favoriteNumber,
         citizenId: citizenArray.length,
         timeAsCitizen: 0,
         isMale: isMale
      });
      citizenArray.push(newCitizen);
      citizenMapping[msg.sender] = newCitizen;
      emit CitizenJoined(
         msg.sender,
         citizenMapping[msg.sender].favoriteNumber,
         citizenMapping[msg.sender].isMale
      );
      citizenId = (citizenArray.length - 1);
   }

   function campaignForLeader() public onlyCitizen {
      if (status != Status.Anarchy) {
         revert SimpleDemocracy__StatusMustBeAnarchy();
      }
      if (citizenMapping[msg.sender].timeAsCitizen < 1 weeks) {
         revert SimpleDemocracy__NewCitizensCantBeLeader();
      }
      ///@dev it's leaderArray.length - 2 because startRevolution() pushes an empty leader object into array
      if (msg.sender == leaderArray[leaderArray.length - 2].addr) {
         revert SimpleDemocracy__YouCausedThisChaos();
      }
      leaderIdToCampaignArray[leaderArray.length - 1].push(
         Campaign({
            addr: msg.sender,
            campaignId: leaderIdToCampaignArray[leaderArray.length - 1].length,
            votes: 0
         })
      );
   }

   function voteForLeader(uint256 campaignId) public onlyCitizen {
      if (hasVoted[msg.sender][leaderArray.length - 1] == true) {
         revert SimpleDemocracy__AlreadyVoted();
      }
      hasVoted[msg.sender][leaderArray.length - 1] = true;
      leaderIdToCampaignArray[leaderArray.length - 1][campaignId].votes++;
   }

   function startRevolution() public onlyCitizen {
      if (status != Status.Peaceful) {
         revert SimpleDemocracy__StatusMustBePeaceful();
      }
      if (isLeader[msg.sender] == true) {
         isLeader[msg.sender] = false;
         status = Status.Anarchy;
         rebelCounter = 0;
         Leader memory leader;
         leaderArray.push(leader);
         emit LeaderOverthrown(
            leaderArray[leaderArray.length - 2].addr,
            leaderArray[leaderArray.length - 2].timeAsLeader
         );
      }
      if (isRebel[msg.sender][leaderArray.length - 1] == true) {
         revert SimpleDemocracy__AlreadyJoinedUprising();
      }
      if (rebelCounter + 1 <= (citizenArray.length / 2)) {
         rebelCounter++;
         isRebel[msg.sender][leaderArray.length - 1] = true;
      } else {
         isLeader[leaderArray[leaderArray.length - 1].addr] = false;
         status = Status.Anarchy;
         rebelCounter = 0;
         Leader memory leader;
         leaderArray.push(leader);
         emit LeaderOverthrown(
            leaderArray[leaderArray.length - 2].addr,
            leaderArray[leaderArray.length - 2].timeAsLeader
         );
      }
   }

   function checkUpkeep(
      bytes memory /*checkdata*/
   )
      public
      view
      override
      returns (
         bool upkeepNeeded,
         bytes memory /*performData*/
      )
   {
      if (
         (status != Status.Peaceful &&
            leaderIdToCampaignArray[leaderArray.length - 1].length == 0)
      ) {
         upkeepNeeded = false;
         //performData = "";
      } else {
         upkeepNeeded = true;
         //performData = "";
      }
   }

   function performUpkeep(
      bytes memory /*performData*/
   ) external override {
      (bool upkeepNeeded, ) = checkUpkeep("0x");
      if (upkeepNeeded == false) {
         revert SimpleDemocracy__UpkeepNotNeeded();
      }
      if (status == Status.Peaceful) {
         leaderArray[leaderArray.length - 1].timeAsLeader = block.timestamp - startingTimestamp;
         for (uint256 i = 0; i < citizenArray.length; i++) {
            citizenArray[i].timeAsCitizen++;
            address citizen = citizenArray[i].addr;
            citizenMapping[citizen].timeAsCitizen = block.timestamp - startingTimestamp;
         }
         emit CivilizationAtPeace(
            leaderArray[leaderArray.length - 1].addr,
            leaderArray[leaderArray.length - 1].timeAsLeader
         );
      } else {
         // this For loop iterates through the current campaignArray to pick the new leader
         uint256 highestVote = 0;
         for (
            uint256 j = 0;
            j < leaderIdToCampaignArray[leaderArray.length - 1].length;
            j++
         ) {
            // this "if" statement gets the highest vote count from the campaigns
            if (
               leaderIdToCampaignArray[leaderArray.length - 1][j].votes >
               highestVote
            ) {
               highestVote = leaderIdToCampaignArray[leaderArray.length - 1][j]
                  .votes;
            }
         }
         // this For loop iterates the campaignArray to see if multiple campaigns have the highestVote
         uint256 tieChecker = 0;
         for (
            uint256 i = 0;
            i < leaderIdToCampaignArray[leaderArray.length - 1].length;
            i++
         ) {
            if (
               leaderIdToCampaignArray[leaderArray.length - 1][i].votes ==
               highestVote
            ) {
               tieChecker++;
               winnerCampaignIds[leaderArray.length - 1].push(i);
            }
            if (tieChecker == 1) {
               Campaign memory winningCampaign = leaderIdToCampaignArray[
                  leaderArray.length - 1
               ][winnerCampaignIds[leaderArray.length - 1][0]];
               Citizen memory winningCitizen = citizenMapping[
                  winningCampaign.addr
               ];
               Leader memory newLeader = Leader({
                  addr: winningCitizen.addr,
                  favoriteNumber: winningCitizen.favoriteNumber,
                  leaderId: leaderArray.length - 1,
                  timeAsLeader: 0,
                  isMale: winningCitizen.isMale
               });
               leaderArray[leaderArray.length - 1] = newLeader;
               emit NewLeaderElected(winningCitizen.addr, highestVote);
            } else {
               emit VRFChoosingNewLeader(tieChecker);
            }
         }
      }
   }

   function getStatus() public view returns (Status) {
      return status;
   }

   function getLeaderArrayLength()
      public
      view
      returns (uint256 leaderArrayLength)
   {
      leaderArrayLength = leaderArray.length;
   }
}
