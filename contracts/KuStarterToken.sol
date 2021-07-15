//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./interfaces/IERC20RemovePauser.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract KuStarterToken is ERC20Pausable, IERC20RemovePauser {

    event PauserRemoved();

    address public pauser;
    address public presale;

    modifier onlyPauser() {
        require(pauser == _msgSender() && address(0) != _msgSender(), "KuStarterToken: caller is not the pauser");
        _;
    }

    modifier onlyPresale() {
        require(presale == _msgSender(), "KuStarterToken: caller is not the presale contract");
        _;
    }

    constructor(
        address[] memory _receivers,
        uint256[] memory _amounts,
        address _presale
    ) ERC20("KuStarter", "KUST") {
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

        presale = _presale;
        pauser = _msgSender();
    }

    function pause() onlyPauser external {
        _pause();
    }

    function unpause() onlyPauser external {
        _unpause();
    }

    /**
     * This allows our presale contract to remove the pausing functionality once the presale is over
     */
    function removePauser() onlyPresale external override {
        pauser = address(0);
        _unpause();
        emit PauserRemoved();
    }
}
