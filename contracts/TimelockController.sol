//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract KuStarterTimelockController is TimelockController {

    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) TimelockController(minDelay, proposers, executors) {
      // This is really just needed to get the TimelockController artficat into the project,
      // we use the standard one from OpenZeppelin in our deploy script
    }
}