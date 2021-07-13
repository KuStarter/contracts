//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVesting {
    function submitMulti(
        address[] memory _receivers,
        uint256[] memory _ends,
        uint256[] memory _amounts,
        uint256[] memory _initials
    ) external returns (bool); 

    function submit(
        address _receiver,
        uint256 _end,
        uint256 _amount,
        uint256 _initial
    ) external returns (bool);
}
