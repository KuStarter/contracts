//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20RemovePauser is IERC20 {
    function removePauser() external;

    function pause() external;
    function unpause() external;
}
