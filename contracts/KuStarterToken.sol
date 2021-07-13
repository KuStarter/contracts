//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract KuStarterToken is ERC20("KuStarter", "KUST") {

    constructor(uint256 _amount) {
        _mint(msg.sender, _amount);
    }
}
