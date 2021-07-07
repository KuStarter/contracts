//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleErc20 is ERC20("Test", "TEST") {

    constructor(uint256 _amount) {
        _mint(msg.sender, _amount);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
