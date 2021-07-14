//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./interfaces/IPresale.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract KuStarterToken is ERC20("KuStarter", "KUST") {
    IPresale public presale;

    constructor(uint256 _amount, address _presale) {
        _mint(msg.sender, _amount);
        presale = IPresale(_presale);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        // needed so that presale can send tokens to Uniswap router
        if (from != address(presale)) {
            require(
                presale.presaleComplete(),
                "KuStarter: presale not complete"
            );
        }
    }
}
