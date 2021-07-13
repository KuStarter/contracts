//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IVesting.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract TokenVesting is IVesting {
    struct Claim {
        uint256 end;
        uint256 amount;
        uint256 remainingAmount;
        uint256 amountPerSecond;
    }

    mapping(address => Claim) public claims;
    uint256 public start;
    IERC20 public token;
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
        token = IERC20(_token);
    }

    function submit(
        address _receiver,
        uint256 _end,
        uint256 _amount,
        uint256 _initialPercentage
    ) public override onlyPresale returns (bool) {
        uint256 initialDistribution = (_amount * _initialPercentage) / 100;
        uint256 vestedDistribution = _amount - initialDistribution;
        bool result = token.transfer(_receiver, initialDistribution);
        claims[_receiver] = Claim(
            _end,
            vestedDistribution,
            vestedDistribution,
            vestedDistribution / (_end - start)
        );
        return result;
    }

    function submitMulti(
        address[] memory _receivers,
        uint256[] memory _ends,
        uint256[] memory _amounts,
        uint256[] memory _initialPercentages
    ) public override onlyPresale returns (bool) {
        require((_receivers.length == _ends.length) &&
                (_ends.length == _amounts.length) &&
                (_amounts.length == _initialPercentages.length),
            "All arrays must be the same length"
        );

        for (uint256 i = 0; i < _receivers.length; i++) {
            bool result = submit(
                _receivers[i],
                _ends[i],
                _amounts[i],
                _initialPercentages[i]
            );
            require(result, "A submit call inside the for loop failed");
        }
        return true;
    }

    function claimTokens(uint256 _amount) public onlyContributor returns (bool) {
        require(_amount <= getAvailable(msg.sender), "Balance not sufficient");
        claims[msg.sender].remainingAmount =
            claims[msg.sender].remainingAmount -
            _amount;
        return token.transfer(msg.sender, _amount);
    }

    function renounce() public onlyContributor {
        uint256 remainingAmount = claims[msg.sender].remainingAmount;
        token.transfer(treasury, remainingAmount);
        delete claims[msg.sender];
    }

    function deposit(uint256 _amount) public onlyTreasury returns (bool) {
        return token.transferFrom(treasury, address(this), _amount);
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
