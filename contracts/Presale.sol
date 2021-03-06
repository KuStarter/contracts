//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./interfaces/IVesting.sol";
import "./interfaces/IERC20RemovePauser.sol";
import "./interfaces/IKoffeeSwapRouter.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Presale is Ownable {
    event Deposited(address indexed user, uint256 amount);
    event Recovered(address token, uint256 amount);

    bool public initialized = false;
    IVesting public vesting;
    address payable public treasury;

    uint256 public presaleStartTimestamp;
    uint256 public presaleEndTimestamp;
    uint256 public tokensPerKcs;
    uint256 public hardCapKcsAmount;
    uint256 public totalDepositedEthBalance;
    uint256 public minimumDepositKcsAmount;
    uint256 public maximumDepositKcsAmount;
    IERC20RemovePauser public KuStarter;

    IKoffeeSwapRouter private koffeeswap;
    uint256 public lock = 0;

    mapping(address => uint256) public deposits;
    mapping(address => bool) public whitelist;
    uint256 public numWhitelisted = 0;

    constructor(
        address payable _treasury,
        uint256 _tokensPerKcs,
        uint256 _hardCapKcs,
        uint256 _minimumDepositKcsAmount,
        uint256 _maximumDepositKcsAmount,
        uint256 _presaleStartTimestamp,
        uint256 _presaleEndTimestamp
    ) {
        koffeeswap = IKoffeeSwapRouter(
            0xc0fFee0000C824D24E0F280f1e4D21152625742b
        );
        treasury = _treasury;
        tokensPerKcs = _tokensPerKcs;
        hardCapKcsAmount = _hardCapKcs;
        minimumDepositKcsAmount = _minimumDepositKcsAmount;
        maximumDepositKcsAmount = _maximumDepositKcsAmount;
        presaleStartTimestamp = _presaleStartTimestamp;
        presaleEndTimestamp = _presaleEndTimestamp;
    }

    function addToWhitelist(address _whitelistee) public onlyOwner {
        require(
            numWhitelisted <= 200,
            "Cannot whitelist more than 200 addresses"
        );
        require(!whitelist[_whitelistee], "Whitelistee already added!");
        whitelist[_whitelistee] = true;
        numWhitelisted++;
    }

    function addToWhitelistMulti(address[] memory _whitelistees)
        public
        onlyOwner
    {
        require(
            _whitelistees.length <= 256,
            "Arrays cannot be over 256 in length"
        );

        for (uint256 i = 0; i < _whitelistees.length; i++) {
            addToWhitelist(_whitelistees[i]);
        }
    }

    function removeFromWhitelist(address _whitelistee) public onlyOwner {
        require(numWhitelisted > 0, "Cannot remove if no one is whitelisted");
        require(whitelist[_whitelistee], "Whitelistee does not exist!");
        whitelist[_whitelistee] = false;
        numWhitelisted--;
    }

    function removeFromWhitelistMulti(address[] memory _whitelistees)
        public
        onlyOwner
    {
        require(
            _whitelistees.length <= 256,
            "Arrays cannot be over 256 in length"
        );

        for (uint256 i = 0; i < _whitelistees.length; i++) {
            removeFromWhitelist(_whitelistees[i]);
        }
    }

    function initialize(
        address _token,
        address _vesting,
        address[] memory _addresses,
        uint256[] memory _ends,
        uint256[] memory _amounts,
        uint256[] memory _initials
    ) public onlyOwner {
        require(!initialized, "Already initialized");
        KuStarter = IERC20RemovePauser(_token);
        vesting = IVesting(_vesting);
        vesting.submitMulti(_addresses, _ends, _amounts, _initials);
        initialized = true;
    }

    receive() external payable {
        require(initialized, "Not initialized");
        require(whitelist[_msgSender()], "You are not in the whitelist!");
        require(
            block.timestamp >= presaleStartTimestamp &&
                block.timestamp <= presaleEndTimestamp,
            "presale is not active"
        );
        require(
            totalDepositedEthBalance + (msg.value) <= hardCapKcsAmount,
            "deposit limits reached"
        );
        require(
            deposits[_msgSender()] + (msg.value) >= minimumDepositKcsAmount &&
                deposits[_msgSender()] + (msg.value) <= maximumDepositKcsAmount,
            "incorrect amount"
        );

        uint256 tokenAmount = msg.value * tokensPerKcs;

        KuStarter.unpause();
        vesting.submit(
            _msgSender(),
            presaleStartTimestamp + 24 weeks,
            tokenAmount,
            20
        );
        KuStarter.pause();

        totalDepositedEthBalance = totalDepositedEthBalance + (msg.value);
        deposits[_msgSender()] = deposits[_msgSender()] + (msg.value);
        emit Deposited(_msgSender(), msg.value);
    }

    function recoverERC20(address tokenAddress, uint256 tokenAmount)
        external
        onlyOwner
        returns (bool)
    {
        require(
            block.timestamp >= lock + (52 weeks),
            "You can claim LP tokens only after 52 weeks"
        );
        bool result = IERC20(tokenAddress).transfer(this.owner(), tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
        return result;
    }

    function getDepositAmount() public view returns (uint256) {
        return totalDepositedEthBalance;
    }

    function releaseFunds() external onlyOwner {
        require(
            block.timestamp >= presaleEndTimestamp &&
                totalDepositedEthBalance < hardCapKcsAmount,
            "Presale is still active, or reached hardcap"
        );
        treasury.transfer(address(this).balance);
    }

    function addLiquidity(uint256 amountTokenDesired) external onlyOwner {
        require(
            block.timestamp >= presaleEndTimestamp ||
                totalDepositedEthBalance >= hardCapKcsAmount,
            "Presale is still active"
        );
        require(lock == 0, "Presale is already completed");

        // Set liquidity lock to now, this will be checked in recoverERC20 and also used for making sure the sale is over
        lock = block.timestamp;
        KuStarter.removePauser();

        uint256 treasuryAmount = address(this).balance / 5;

        treasury.transfer(treasuryAmount);

        uint256 liquidityEth = address(this).balance;

        KuStarter.approve(address(koffeeswap), amountTokenDesired);
        koffeeswap.addLiquidityKCS{value: (liquidityEth)}(
            address(KuStarter),
            amountTokenDesired,
            amountTokenDesired,
            liquidityEth,
            address(this),
            block.timestamp + 60
        );
    }

    function presaleComplete() external view returns (bool) {
        return lock != 0;
    }
}
