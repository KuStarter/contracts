//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface Token {
    function mint(address to, uint256 value) external;

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external;
}

contract TokenVesting {
    struct Claim {
        uint256 end;
        uint256 amount;
        uint256 remainingAmount;
        uint256 amountPerSecond;
    }

    mapping(address => Claim) public claims;
    uint256 public start;
    Token public token;
    address public treasury;
    address public presale;

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Not treasury");
        _;
    }

    modifier onlyContributor() {
        require(
            claims[msg.sender].amount > 0,
            "Not a contributor or renounced"
        );
        _;
    }

    modifier onlyPresale() {
        require(msg.sender == presale, "Not presale");
        _;
    }

    constructor(
        address _presale,
        address _treasury,
        uint256 _start,
        address _token
    ) {
        presale = _presale;
        treasury = _treasury;
        start = _start;
        token = Token(_token);
    }

    function submit(
        address _receiver,
        uint256 _end,
        uint256 _amount,
        uint256 _initial
    ) public onlyPresale {
        uint256 initialDistribution = (_amount * _initial) / 100;
        uint256 vestedDistribution = _amount - initialDistribution;
        token.mint(_receiver, vestedDistribution);
        claims[_receiver] = Claim(
            _end,
            vestedDistribution,
            vestedDistribution,
            vestedDistribution / (_end - start)
        );
    }

    function submitMulti(
        address[] memory _receivers,
        uint256[] memory _ends,
        uint256[] memory _amounts,
        uint256[] memory _initials
    ) public onlyPresale {
        for (uint256 i = 0; i < _receivers.length; i++) {
            submit(_receivers[i], _ends[i], _amounts[i], _initials[i]);
        }
    }

    function claimTokens(uint256 _amount) public onlyContributor {
        require(_amount <= getAvailable(msg.sender), "Balance not sufficient");
        claims[msg.sender].remainingAmount =
            claims[msg.sender].remainingAmount -
            _amount;
        token.mint(msg.sender, _amount);
    }

    function renounce() public onlyContributor {
        uint256 remainingAmount = claims[msg.sender].remainingAmount;
        token.mint(treasury, remainingAmount);
        delete claims[msg.sender];
    }

    function deposit(uint256 _amount) public onlyTreasury {
        token.transferFrom(treasury, address(this), _amount);
    }

    function updateTreasury(address _treasury) public onlyTreasury {
        treasury = _treasury;
    }

    function getAvailable(address _receiver) public view returns (uint256) {
        Claim memory claim = claims[_receiver];

        uint256 delta = deltaOf(claim);
        uint256 recipientBalance = delta * (claim.amountPerSecond);

        if (claim.amount > claim.remainingAmount) {
            uint256 withdrawnAmount = claim.amount - (claim.remainingAmount);
            recipientBalance = recipientBalance - (withdrawnAmount);
        }

        return recipientBalance;
    }

    function deltaOf(Claim memory claim) internal view returns (uint256) {
        if (block.timestamp <= start) return 0;
        if (block.timestamp < claim.end) return block.timestamp - start;
        return claim.end - start;
    }
}
