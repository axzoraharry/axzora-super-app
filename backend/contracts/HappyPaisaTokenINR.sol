// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HappyPaisaToken (HP) - INR Pegged
 * @dev A collateral-backed stable token where 1 HP = 1000 INR - NO FEES
 * Uses USDT as collateral with INR/USD conversion rate
 */
contract HappyPaisaTokenINR is ERC20, Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable USDT;
    
    // INR pegging: 1 HP = 1000 INR
    uint256 public constant HP_INR_VALUE = 1000; // 1 HP = 1000 INR
    
    // INR to USD conversion rate (with 6 decimals precision)
    // Example: If 1 USD = 83.50 INR, then inrToUsdRate = 835000 (83.5 * 10000)
    uint256 public inrToUsdRate = 835000; // Default: 1 USD = 83.5 INR
    uint256 public constant RATE_DECIMALS = 10000; // For 4 decimal precision
    
    // Collateral tracking
    uint256 public totalCollateral; // Total USDT collateral
    uint256 public reserveRatio = 105; // 105% collateralization ratio
    
    // Events
    event TokensMinted(address indexed to, uint256 hpAmount, uint256 usdtCollateral, uint256 inrValue);
    event TokensBurned(address indexed from, uint256 hpAmount, uint256 usdtReturned, uint256 inrValue);
    event INRRateUpdated(uint256 oldRate, uint256 newRate);
    event CollateralDeposited(address indexed depositor, uint256 amount);
    event CollateralWithdrawn(address indexed withdrawer, uint256 amount);
    event ReserveRatioUpdated(uint256 oldRatio, uint256 newRatio);
    
    constructor(address _usdtAddress) ERC20("Happy Paisa Token", "HP") Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        USDT = IERC20(_usdtAddress);
    }
    
    /**
     * @dev Update INR to USD conversion rate (only owner)
     * @param newRate New rate with 4 decimal precision (e.g., 835000 for 83.5 INR per USD)
     */
    function updateINRToUSDRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be greater than 0");
        require(newRate <= 10000000, "Rate too high"); // Max 1000 INR per USD
        
        uint256 oldRate = inrToUsdRate;
        inrToUsdRate = newRate;
        
        emit INRRateUpdated(oldRate, newRate);
    }
    
    /**
     * @dev Calculate USDT equivalent for INR amount
     * @param inrAmount Amount in INR
     * @return USDT amount (with 6 decimals)
     */
    function inrToUsdt(uint256 inrAmount) public view returns (uint256) {
        // inrAmount * (1 USD / inrToUsdRate) * 10^6 (USDT decimals)
        return (inrAmount * RATE_DECIMALS * 10**6) / inrToUsdRate;
    }
    
    /**
     * @dev Calculate INR equivalent for USDT amount
     * @param usdtAmount Amount in USDT (with 6 decimals)
     * @return INR amount
     */
    function usdtToInr(uint256 usdtAmount) public view returns (uint256) {
        // usdtAmount * inrToUsdRate / (10^6 * RATE_DECIMALS)
        return (usdtAmount * inrToUsdRate) / (10**6 * RATE_DECIMALS);
    }
    
    /**
     * @dev Mint HP tokens by depositing USDT collateral - NO FEES
     * @param hpAmount Amount of HP tokens to mint
     */
    function mintTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        
        // Calculate INR value
        uint256 inrValue = (hpAmount * HP_INR_VALUE) / 10**18; // Convert from wei
        
        // Calculate required USDT collateral
        uint256 baseCollateralUsdt = inrToUsdt(inrValue);
        uint256 requiredCollateral = (baseCollateralUsdt * reserveRatio) / 100;
        
        // Transfer USDT from user
        require(
            USDT.transferFrom(msg.sender, address(this), requiredCollateral),
            "USDT transfer failed"
        );
        
        // Update collateral tracking
        totalCollateral += requiredCollateral;
        
        // Mint HP tokens
        _mint(msg.sender, hpAmount);
        
        emit TokensMinted(msg.sender, hpAmount, requiredCollateral, inrValue);
    }
    
    /**
     * @dev Burn HP tokens and return USDT collateral - NO FEES
     * @param hpAmount Amount of HP tokens to burn
     */
    function burnTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= hpAmount, "Insufficient HP balance");
        
        // Calculate INR value
        uint256 inrValue = (hpAmount * HP_INR_VALUE) / 10**18; // Convert from wei
        
        // Calculate USDT to return (at current rate, no fees)
        uint256 usdtToReturn = inrToUsdt(inrValue);
        
        require(totalCollateral >= usdtToReturn, "Insufficient collateral");
        require(USDT.balanceOf(address(this)) >= usdtToReturn, "Insufficient USDT balance");
        
        // Update collateral tracking
        totalCollateral -= usdtToReturn;
        
        // Burn HP tokens
        _burn(msg.sender, hpAmount);
        
        // Return USDT
        require(USDT.transfer(msg.sender, usdtToReturn), "USDT transfer failed");
        
        emit TokensBurned(msg.sender, hpAmount, usdtToReturn, inrValue);
    }
    
    /**
     * @dev Calculate how much USDT is needed to mint HP tokens
     * @param hpAmount Amount of HP tokens to mint
     * @return Required USDT amount
     */
    function calculateCollateralNeeded(uint256 hpAmount) external view returns (uint256) {
        uint256 inrValue = (hpAmount * HP_INR_VALUE) / 10**18;
        uint256 baseCollateralUsdt = inrToUsdt(inrValue);
        return (baseCollateralUsdt * reserveRatio) / 100;
    }
    
    /**
     * @dev Calculate how much USDT will be returned when burning HP
     * @param hpAmount Amount of HP tokens to burn
     * @return USDT amount to be returned
     */
    function calculateUSDTReturn(uint256 hpAmount) external view returns (uint256) {
        uint256 inrValue = (hpAmount * HP_INR_VALUE) / 10**18;
        return inrToUsdt(inrValue);
    }
    
    /**
     * @dev Get current rates and contract info
     */
    function getContractInfo() external view returns (
        uint256 totalSupplyHP,
        uint256 totalCollateralUSDT,
        uint256 currentReserveRatio,
        uint256 currentINRToUSDRate,
        uint256 oneHPInINR,
        uint256 oneHPInUSDT
    ) {
        totalSupplyHP = totalSupply();
        totalCollateralUSDT = totalCollateral;
        currentReserveRatio = reserveRatio;
        currentINRToUSDRate = inrToUsdRate;
        oneHPInINR = HP_INR_VALUE;
        oneHPInUSDT = inrToUsdt(HP_INR_VALUE);
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
     * @dev Owner can withdraw excess collateral
     * @param amount Amount of USDT to withdraw
     */
    function withdrawExcessCollateral(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 totalHPSupply = totalSupply();
        if (totalHPSupply > 0) {
            uint256 totalInrValue = (totalHPSupply * HP_INR_VALUE) / 10**18;
            uint256 baseCollateralNeeded = inrToUsdt(totalInrValue);
            uint256 minRequiredCollateral = (baseCollateralNeeded * reserveRatio) / 100;
            
            require(totalCollateral > minRequiredCollateral, "No excess collateral");
            require(amount <= (totalCollateral - minRequiredCollateral), "Amount exceeds excess");
        }
        
        totalCollateral -= amount;
        require(USDT.transfer(msg.sender, amount), "USDT transfer failed");
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Update reserve ratio (only owner)
     * @param newRatio New reserve ratio (100 = 100%, 105 = 105%, etc.)
     */
    function updateReserveRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Reserve ratio must be at least 100%");
        require(newRatio <= 150, "Reserve ratio cannot exceed 150%");
        
        uint256 oldRatio = reserveRatio;
        reserveRatio = newRatio;
        
        emit ReserveRatioUpdated(oldRatio, newRatio);
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