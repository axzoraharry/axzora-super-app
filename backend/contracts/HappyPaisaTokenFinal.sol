// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HappyPaisaToken (HP)
 * @dev A collateral-backed stable token where 1 HP = 11 USDT - NO FEES
 * The contract maintains a collateral pool of USDT to back the HP tokens
 */
contract HappyPaisaTokenFinal is ERC20, Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable USDT;
    
    // 1 HP = 11 USDT (using 6 decimals for USDT precision) - NO FEES
    uint256 public constant HP_TO_USDT_RATE = 11 * 10**6; // 11 USDT (6 decimals)
    uint256 public constant HP_DECIMALS = 18;
    
    // Collateral tracking
    uint256 public totalCollateral; // Total USDT collateral
    uint256 public reserveRatio = 105; // 105% collateralization ratio (5% over-collateralized)
    
    // Events
    event TokensMinted(address indexed to, uint256 hpAmount, uint256 usdtCollateral);
    event TokensBurned(address indexed from, uint256 hpAmount, uint256 usdtReturned);
    event CollateralDeposited(address indexed depositor, uint256 amount);
    event CollateralWithdrawn(address indexed withdrawer, uint256 amount);
    event ReserveRatioUpdated(uint256 oldRatio, uint256 newRatio);
    
    constructor(address _usdtAddress) ERC20("Happy Paisa Token", "HP") Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        USDT = IERC20(_usdtAddress);
    }
    
    /**
     * @dev Mint HP tokens by depositing USDT collateral - NO FEES
     * @param hpAmount Amount of HP tokens to mint
     */
    function mintTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        
        // Calculate required USDT collateral (with reserve ratio) - NO ADDITIONAL FEES
        uint256 baseCollateral = (hpAmount * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
        uint256 requiredCollateral = (baseCollateral * reserveRatio) / 100;
        
        // Transfer USDT from user - EXACT AMOUNT, NO FEES
        require(
            USDT.transferFrom(msg.sender, address(this), requiredCollateral),
            "USDT transfer failed"
        );
        
        // Update collateral tracking
        totalCollateral += requiredCollateral;
        
        // Mint HP tokens
        _mint(msg.sender, hpAmount);
        
        emit TokensMinted(msg.sender, hpAmount, requiredCollateral);
    }
    
    /**
     * @dev Burn HP tokens and return USDT collateral - NO FEES
     * @param hpAmount Amount of HP tokens to burn
     */
    function burnTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= hpAmount, "Insufficient HP balance");
        
        // Calculate USDT to return (at base rate) - NO FEES DEDUCTED
        uint256 usdtToReturn = (hpAmount * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
        
        require(totalCollateral >= usdtToReturn, "Insufficient collateral");
        require(USDT.balanceOf(address(this)) >= usdtToReturn, "Insufficient USDT balance");
        
        // Update collateral tracking
        totalCollateral -= usdtToReturn;
        
        // Burn HP tokens
        _burn(msg.sender, hpAmount);
        
        // Return USDT - FULL AMOUNT, NO FEES
        require(USDT.transfer(msg.sender, usdtToReturn), "USDT transfer failed");
        
        emit TokensBurned(msg.sender, hpAmount, usdtToReturn);
    }
    
    /**
     * @dev Owner can deposit additional USDT collateral
     * @param amount Amount of USDT to deposit
     */
    function depositCollateral(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        require(
            USDT.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
        
        totalCollateral += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Owner can withdraw excess collateral (only if over-collateralized)
     * @param amount Amount of USDT to withdraw
     */
    function withdrawExcessCollateral(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate minimum required collateral
        uint256 totalHPSupply = totalSupply();
        uint256 baseCollateralNeeded = (totalHPSupply * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
        uint256 minRequiredCollateral = (baseCollateralNeeded * reserveRatio) / 100;
        
        require(totalCollateral > minRequiredCollateral, "No excess collateral");
        require(amount <= (totalCollateral - minRequiredCollateral), "Amount exceeds excess");
        
        totalCollateral -= amount;
        
        require(USDT.transfer(msg.sender, amount), "USDT transfer failed");
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Update the reserve ratio (only owner)
     * @param newRatio New reserve ratio (100 = 100%, 105 = 105%, etc.)
     */
    function updateReserveRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Reserve ratio must be at least 100%");
        require(newRatio <= 150, "Reserve ratio cannot exceed 150%");
        
        uint256 oldRatio = reserveRatio;
        reserveRatio = newRatio;
        
        emit ReserveRatioUpdated(oldRatio, newRatio);
    }
    
    /**
     * @dev Get the current collateralization ratio
     * @return Current collateralization ratio as a percentage
     */
    function getCurrentCollateralizationRatio() external view returns (uint256) {
        uint256 totalHPSupply = totalSupply();
        if (totalHPSupply == 0) return 0;
        
        uint256 baseValue = (totalHPSupply * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
        if (baseValue == 0) return 0;
        
        return (totalCollateral * 100) / baseValue;
    }
    
    /**
     * @dev Calculate how much USDT is needed to mint a specific amount of HP - NO FEES
     * @param hpAmount Amount of HP tokens to mint
     * @return Required USDT amount
     */
    function calculateCollateralNeeded(uint256 hpAmount) external view returns (uint256) {
        uint256 baseCollateral = (hpAmount * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
        return (baseCollateral * reserveRatio) / 100;
    }
    
    /**
     * @dev Calculate how much USDT will be returned when burning HP - NO FEES
     * @param hpAmount Amount of HP tokens to burn
     * @return USDT amount to be returned
     */
    function calculateUSDTReturn(uint256 hpAmount) external pure returns (uint256) {
        return (hpAmount * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
    }
    
    /**
     * @dev Get contract info
     */
    function getContractInfo() external view returns (
        uint256 totalSupplyHP,
        uint256 totalCollateralUSDT,
        uint256 currentReserveRatio,
        uint256 currentCollateralizationRatio
    ) {
        totalSupplyHP = totalSupply();
        totalCollateralUSDT = totalCollateral;
        currentReserveRatio = reserveRatio;
        
        if (totalSupplyHP == 0) {
            currentCollateralizationRatio = 0;
        } else {
            uint256 baseValue = (totalSupplyHP * HP_TO_USDT_RATE) / 10**HP_DECIMALS;
            currentCollateralizationRatio = baseValue == 0 ? 0 : (totalCollateral * 100) / baseValue;
        }
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
    
    // Override transfer functions to add pause functionality
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}