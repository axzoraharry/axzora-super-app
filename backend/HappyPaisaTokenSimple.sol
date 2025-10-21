// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HappyPaisaTokenSimple (HP)
 * @dev A simple collateral-backed token pegged at 11 USDT - NO FEES
 * Features:
 * - Target peg: 11 USDT per HP
 * - No fees whatsoever
 * - Mint/burn only functionality (no swaps)
 * - Simple and efficient
 */
contract HappyPaisaTokenSimple is ERC20, Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable USDT;
    
    // Core peg parameters
    uint256 public constant TARGET_PEG = 11 * 10**6; // 11 USDT (6 decimals)
    uint256 public constant HP_DECIMALS = 18;
    
    // Collateral tracking
    uint256 public totalCollateral; // Total USDT collateral
    uint256 public collateralRatio = 105; // 105% collateral ratio
    
    // Events
    event TokensMinted(address indexed user, uint256 hpAmount, uint256 usdtCollateral);
    event TokensBurned(address indexed user, uint256 hpAmount, uint256 usdtReturned);
    event CollateralRatioUpdated(uint256 oldRatio, uint256 newRatio);
    
    constructor(address _usdtAddress) ERC20("Happy Paisa Token Simple", "HP") Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        USDT = IERC20(_usdtAddress);
    }
    
    /**
     * @dev Mint HP tokens by depositing USDT collateral - NO FEES
     * @param hpAmount Amount of HP tokens to mint
     */
    function mintTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        
        // Calculate required USDT collateral
        uint256 baseCollateral = (hpAmount * TARGET_PEG) / (10**HP_DECIMALS);
        uint256 requiredCollateral = (baseCollateral * collateralRatio) / 100;
        
        // Transfer USDT from user (NO FEES)
        require(
            USDT.transferFrom(msg.sender, address(this), requiredCollateral),
            "USDT transfer failed"
        );
        
        // Update tracking
        totalCollateral += requiredCollateral;
        
        // Mint HP tokens
        _mint(msg.sender, hpAmount);
        
        emit TokensMinted(msg.sender, hpAmount, requiredCollateral);
    }
    
    /**
     * @dev Burn HP tokens and return USDT - NO FEES
     * @param hpAmount Amount of HP tokens to burn
     */
    function burnTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= hpAmount, "Insufficient HP balance");
        
        // Calculate USDT to return (at target peg - NO FEES)
        uint256 usdtToReturn = (hpAmount * TARGET_PEG) / (10**HP_DECIMALS);
        
        require(totalCollateral >= usdtToReturn, "Insufficient collateral");
        require(USDT.balanceOf(address(this)) >= usdtToReturn, "Insufficient USDT balance");
        
        // Update tracking
        totalCollateral -= usdtToReturn;
        
        // Burn HP tokens
        _burn(msg.sender, hpAmount);
        
        // Return USDT
        require(USDT.transfer(msg.sender, usdtToReturn), "USDT transfer failed");
        
        emit TokensBurned(msg.sender, hpAmount, usdtToReturn);
    }
    
    /**
     * @dev Calculate collateral needed for minting (NO FEES)
     */
    function calculateMintCost(uint256 hpAmount) external view returns (uint256 collateralNeeded) {
        uint256 baseCollateral = (hpAmount * TARGET_PEG) / (10**HP_DECIMALS);
        collateralNeeded = (baseCollateral * collateralRatio) / 100;
    }
    
    /**
     * @dev Calculate USDT returned from burning (NO FEES)
     */
    function calculateBurnReturn(uint256 hpAmount) external pure returns (uint256 usdtReturned) {
        usdtReturned = (hpAmount * TARGET_PEG) / (10**HP_DECIMALS);
    }
    
    /**
     * @dev Get contract status
     */
    function getContractInfo() external view returns (
        uint256 totalSupplyHP,
        uint256 totalCollateralUSDT,
        uint256 currentCollateralRatio,
        uint256 backingRatio
    ) {
        totalSupplyHP = totalSupply();
        totalCollateralUSDT = totalCollateral;
        currentCollateralRatio = collateralRatio;
        
        if (totalSupplyHP > 0) {
            uint256 totalValue = (totalSupplyHP * TARGET_PEG) / (10**HP_DECIMALS);
            backingRatio = (totalCollateral * 100) / totalValue;
        }
    }
    
    // Administrative functions
    function updateCollateralRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Ratio must be at least 100%");
        require(newRatio <= 200, "Ratio cannot exceed 200%");
        
        uint256 oldRatio = collateralRatio;
        collateralRatio = newRatio;
        
        emit CollateralRatioUpdated(oldRatio, newRatio);
    }
    
    function withdrawExcessCollateral(uint256 amount) external onlyOwner {
        uint256 totalSupplyHP = totalSupply();
        if (totalSupplyHP > 0) {
            uint256 requiredCollateral = (totalSupplyHP * TARGET_PEG * collateralRatio) / (10**HP_DECIMALS * 100);
            require(totalCollateral > requiredCollateral, "No excess collateral");
            require(amount <= (totalCollateral - requiredCollateral), "Amount exceeds excess");
        }
        
        totalCollateral -= amount;
        require(USDT.transfer(owner(), amount), "Transfer failed");
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(USDT.transfer(owner(), amount), "Transfer failed");
    }
    
    // Override transfers to add pause functionality
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}