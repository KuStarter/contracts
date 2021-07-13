//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./interfaces/IVesting.sol";

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

import "hardhat/console.sol";

contract Presale is Ownable, Pausable {
    event Deposited(address indexed user, uint256 amount);
    event Recovered(address token, uint256 amount);

    bool public seedSale = true;
    bool public initialized = false;
    IVesting public vesting;
    address payable public liquidity;

    uint256 public presaleStartTimestamp;
    uint256 public presaleEndTimestamp;
    uint256 public tokensPerKcs;
    uint256 public hardCapEthAmount;
    uint256 public totalDepositedEthBalance;
    uint256 public minimumDepositKcsAmount;
    uint256 public maximumDepositKcsAmount;

    IUniswapV2Router02 private uniswap;
    uint256 public lock;
    uint256 saleCompleted = 0;
    address public token;

    mapping(address => uint256) public deposits;

    constructor(address payable _liquidity, uint256 _tokensPerKcs, uint256 _hardCapKcs, uint256 _minimumDepositKcsAmount, uint256 _maximumDepositKcsAmount) {
        uniswap = IUniswapV2Router02(0xc0fFee0000C824D24E0F280f1e4D21152625742b); // TODO: Choose KCC DEX, using KoffewSwap for now, NB: KoffeeSwap broke the ABI and uses addLiquidityKCS for example (https://github.com/KoffeeSwap/koffeeswap-contracts/blob/master/router/KoffeeSwapRouter.sol)
        liquidity = _liquidity;
        tokensPerKcs = _tokensPerKcs;
        hardCapEthAmount = _hardCapKcs;
        minimumDepositKcsAmount = _minimumDepositKcsAmount;
        maximumDepositKcsAmount = _maximumDepositKcsAmount;
        _pause();
    }

    function initialize(address _vesting) public onlyOwner {
        require(!initialized, "Already initialized");
        vesting = IVesting(_vesting);
        initialized = true;
    }

    function addPrivateAllocations(address[] memory _addresses, uint256[] memory _ends, uint256[] memory _amounts, uint256[] memory _initials) public onlyOwner {
        require(seedSale == true, 'Private sale is ended');
        vesting.submitMulti(_addresses, _ends, _amounts, _initials);
        seedSale = false;
    }

    receive() external payable {
        require(seedSale == false, 'Private sale is not ended');
        require(
            block.timestamp >= presaleStartTimestamp && block.timestamp <= presaleEndTimestamp,
            'presale is not active'
        );
        require(totalDepositedEthBalance + (msg.value) <= hardCapEthAmount, 'deposit limits reached');
        require(
            deposits[msg.sender] + (msg.value) >= minimumDepositKcsAmount &&
                deposits[msg.sender] + (msg.value) <= maximumDepositKcsAmount,
            'incorrect amount'
        );

        uint256 tokenAmount = msg.value * tokensPerKcs;
        vesting.submit(msg.sender, block.timestamp + 12 weeks, tokenAmount);
        totalDepositedEthBalance = totalDepositedEthBalance + (msg.value);
        deposits[msg.sender] = deposits[msg.sender] + (msg.value);
        emit Deposited(msg.sender, msg.value);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        _unpause();
        emit Unpaused(msg.sender);
    }

    function withdraw() external onlyOwner {
        require(seedSale == true, 'Private sale is ended');
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function releaseFunds() external onlyOwner {
        require(
            block.timestamp >= presaleEndTimestamp || totalDepositedEthBalance == hardCapEthAmount,
            'presale is active'
        );
        uint256 liquidityEth = address(this).balance / (2);
        liquidity.transfer(liquidityEth);
    }

    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner returns (bool) {
        require(block.timestamp >= lock + (52 weeks), 'You can claim LP tokens only after 52 weeks');
        bool result = IERC20(tokenAddress).transfer(this.owner(), tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
        return result;
    }

    function getDepositAmount() public view returns (uint256) {
        return totalDepositedEthBalance;
    }

    function saleComplete() external onlyOwner {
        saleCompleted = block.timestamp;
    }

    function addLiquidity() external {
        require(block.timestamp < saleCompleted + 15 minutes, 'Listing cannot occur less than 15 minutes before presale finishes');

        // Set liquidity lock to now, this will be checked in recoverERC20
        lock = block.timestamp;

        uint256 amountTokenDesired = address(this).balance * 120000;
        
        IERC20(address(token)).approve(address(uniswap), amountTokenDesired);
        uniswap.addLiquidityETH{value: (address(this).balance)}(
            address(token),
            amountTokenDesired,
            amountTokenDesired,
            address(this).balance,
            address(this),
            block.timestamp + 2 hours
        );
    }

}
