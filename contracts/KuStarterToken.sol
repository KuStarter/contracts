//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./interfaces/IPresale.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract KuStarterToken is ERC20("KuStarter", "KUST") {
    IPresale public presale;

    constructor(
        address[] memory _receivers,
        uint256[] memory _amounts,
        address _presale
    ) {
        require(
            _receivers.length <= 7,
            "_receivers cannot be over 7 in length"
        );
        require(
            _receivers.length == _amounts.length,
            "Arrays must be the same length"
        );

        for (uint256 i = 0; i < _receivers.length; i++) {
            _mint(_receivers[i], _amounts[i]);
        }
        
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
