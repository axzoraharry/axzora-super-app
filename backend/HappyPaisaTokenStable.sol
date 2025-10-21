// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HappyPaisaTokenStable (HP)
 * @dev A algorithmically stabilized token pegged at 11 USDT with dynamic mechanisms
 * Features:
 * - Target peg: 11 USDT per HP
 * - Dynamic collateral ratios
 * - Mint/burn only functionality (no swaps)
 * - Stability mechanisms to maintain peg
 * - Emergency controls
 */
contract HappyPaisaTokenStable is ERC20, Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable USDT;
    
    // Core peg parameters
    uint256 public constant TARGET_PEG = 11 * 10**6; // 11 USDT (6 decimals)
    uint256 public constant HP_DECIMALS = 18;
    uint256 public constant PRECISION = 10**18;
    
    // Dynamic stability parameters
    uint256 public currentPeg = TARGET_PEG; // Current effective peg rate
    uint256 public baseCollateralRatio = 105; // Base collateral ratio (105%)
    uint256 public maxCollateralRatio = 150; // Maximum collateral ratio (150%)
    uint256 public minCollateralRatio = 100; // Minimum collateral ratio (100%)
    
    // Stability mechanism parameters
    uint256 public pegAdjustmentFactor = 50; // 0.5% max adjustment per operation
    uint256 public stabilityBuffer = 200; // 2% buffer around target peg
    uint256 public rebalanceThreshold = 500; // 5% threshold for auto-rebalancing
    
    // Tracking variables
    uint256 public totalCollateral; // Total USDT collateral
    uint256 public totalMinted; // Total HP tokens minted
    uint256 public totalBurned; // Total HP tokens burned
    uint256 public lastRebalanceTime;
    
    // No fees - completely fee-free token
    uint256 public constant mintFee = 0; // 0% mint fee
    uint256 public constant burnFee = 0; // 0% burn fee
    uint256 public constant stabilityFee = 0; // 0% stability fee
    
    // Stability reserves (no treasury fees)
    uint256 public stabilityFund; // Emergency stability fund
    
    // Events
    event TokensMinted(
        address indexed user,
        uint256 hpAmount,
        uint256 usdtCollateral,
        uint256 effectivePeg
    );
    
    event TokensBurned(
        address indexed user,
        uint256 hpAmount,
        uint256 usdtReturned,
        uint256 effectivePeg
    );
    
    event PegAdjusted(uint256 oldPeg, uint256 newPeg, string reason);
    event CollateralRatioUpdated(uint256 oldRatio, uint256 newRatio);
    event StabilityRebalance(uint256 collateralAdded, uint256 collateralRemoved);
    event EmergencyAction(string action, uint256 value);
    
    constructor(
        address _usdtAddress
    ) ERC20("Happy Paisa Token Stable", "HP") Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        
        USDT = IERC20(_usdtAddress);
        lastRebalanceTime = block.timestamp;
    }
    
    /**
     * @dev Mint HP tokens with dynamic peg adjustment
     * @param hpAmount Amount of HP tokens to mint
     */
    function mintTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        
        // Get current effective peg and collateral ratio
        uint256 effectivePeg = getCurrentEffectivePeg();
        uint256 currentRatio = getCurrentCollateralRatio();
        
        // Calculate required USDT collateral (no fees)
        uint256 baseCollateral = (hpAmount * effectivePeg) / (10**HP_DECIMALS);
        uint256 requiredCollateral = (baseCollateral * currentRatio) / 100;
        
        // Transfer USDT from user (no additional fees)
        require(
            USDT.transferFrom(msg.sender, address(this), requiredCollateral),
            "USDT transfer failed"
        );
        
        // Update tracking
        totalCollateral += requiredCollateral;
        totalMinted += hpAmount;
        
        // Mint HP tokens
        _mint(msg.sender, hpAmount);
        
        // Trigger stability check
        _stabilityCheck();
        
        emit TokensMinted(msg.sender, hpAmount, requiredCollateral, effectivePeg);
    }
    
    /**
     * @dev Burn HP tokens and return USDT
     * @param hpAmount Amount of HP tokens to burn
     */
    function burnTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= hpAmount, "Insufficient HP balance");
        
        // Get current effective peg
        uint256 effectivePeg = getCurrentEffectivePeg();
        
        // Calculate USDT to return (at target peg for stability, no fees)
        uint256 usdtToReturn = (hpAmount * TARGET_PEG) / (10**HP_DECIMALS);
        
        require(totalCollateral >= usdtToReturn, "Insufficient collateral");
        require(USDT.balanceOf(address(this)) >= usdtToReturn, "Insufficient USDT balance");
        
        // Update tracking
        totalCollateral -= usdtToReturn;
        totalBurned += hpAmount;
        
        // Burn HP tokens
        _burn(msg.sender, hpAmount);
        
        // Transfer USDT
        require(USDT.transfer(msg.sender, usdtToReturn), "USDT transfer failed");
        
        // Trigger stability check
        _stabilityCheck();
        
        emit TokensBurned(msg.sender, hpAmount, usdtToReturn, effectivePeg);
    }
    
    /**
     * @dev Get current effective peg rate with stability adjustments
     */
    function getCurrentEffectivePeg() public view returns (uint256) {
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) return TARGET_PEG;
        
        // Calculate current backing ratio
        uint256 backingValue = totalCollateral;
        uint256 totalValue = (totalSupply * TARGET_PEG) / (10**HP_DECIMALS);
        
        if (totalValue == 0) return TARGET_PEG;
        
        uint256 backingRatio = (backingValue * 100) / totalValue;
        
        // Adjust peg based on backing ratio
        if (backingRatio > (100 + rebalanceThreshold)) {
            // Over-collateralized: slightly increase effective peg (make minting cheaper)
            return TARGET_PEG - (TARGET_PEG * pegAdjustmentFactor) / 10000;
        } else if (backingRatio < (100 - rebalanceThreshold)) {
            // Under-collateralized: slightly decrease effective peg (make minting more expensive)
            return TARGET_PEG + (TARGET_PEG * pegAdjustmentFactor) / 10000;
        }
        
        return TARGET_PEG;
    }
    
    /**
     * @dev Get current dynamic collateral ratio
     */
    function getCurrentCollateralRatio() public view returns (uint256) {
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) return baseCollateralRatio;
        
        // Calculate utilization ratio
        uint256 totalValue = (totalSupply * TARGET_PEG) / (10**HP_DECIMALS);
        uint256 utilizationRatio = totalCollateral > 0 ? (totalValue * 100) / totalCollateral : 0;
        
        // Adjust collateral ratio based on utilization
        if (utilizationRatio > 90) {
            // High utilization: increase collateral requirements
            return Math.min(maxCollateralRatio, baseCollateralRatio + 10);
        } else if (utilizationRatio < 70) {
            // Low utilization: decrease collateral requirements
            return Math.max(minCollateralRatio, baseCollateralRatio - 5);
        }
        
        return baseCollateralRatio;
    }
    
    /**
     * @dev Internal stability check and rebalancing
     */
    function _stabilityCheck() internal {
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) return;
        
        // Check if rebalancing is needed
        uint256 totalValue = (totalSupply * TARGET_PEG) / (10**HP_DECIMALS);
        uint256 backingRatio = totalCollateral > 0 ? (totalCollateral * 100) / totalValue : 0;
        
        // If significantly over or under-collateralized, trigger rebalancing
        if (backingRatio > (100 + rebalanceThreshold) || backingRatio < (100 - rebalanceThreshold)) {
            _triggerRebalance(backingRatio);
        }
    }
    
    /**
     * @dev Trigger automatic rebalancing
     */
    function _triggerRebalance(uint256 currentRatio) internal {
        if (block.timestamp < lastRebalanceTime + 1 hours) return; // Rate limit
        
        uint256 totalSupply = totalSupply();
        uint256 targetCollateral = (totalSupply * TARGET_PEG) / (10**HP_DECIMALS);
        
        if (currentRatio > 110 && stabilityFund > 0) {
            // Over-collateralized: use stability fund to buy back and burn
            uint256 excess = totalCollateral - targetCollateral;
            uint256 buybackAmount = Math.min(excess / 2, stabilityFund);
            
            if (buybackAmount > 0) {
                stabilityFund -= buybackAmount;
                totalCollateral -= buybackAmount;
                emit StabilityRebalance(0, buybackAmount);
            }
        } else if (currentRatio < 95 && stabilityFund > 0) {
            // Under-collateralized: use stability fund to add collateral
            uint256 deficit = targetCollateral - totalCollateral;
            uint256 addAmount = Math.min(deficit, stabilityFund);
            
            if (addAmount > 0) {
                stabilityFund -= addAmount;
                totalCollateral += addAmount;
                emit StabilityRebalance(addAmount, 0);
            }
        }
        
        lastRebalanceTime = block.timestamp;
    }
    
    /**
     * @dev Calculate collateral needed for minting
     */
    function calculateMintCost(uint256 hpAmount) external view returns (
        uint256 collateralNeeded,
        uint256 effectivePeg
    ) {
        effectivePeg = getCurrentEffectivePeg();
        uint256 currentRatio = getCurrentCollateralRatio();
        
        uint256 baseCollateral = (hpAmount * effectivePeg) / (10**HP_DECIMALS);
        collateralNeeded = (baseCollateral * currentRatio) / 100;
    }
    
    /**
     * @dev Calculate USDT returned from burning
     */
    function calculateBurnReturn(uint256 hpAmount) external view returns (
        uint256 usdtReturned
    ) {
        usdtReturned = (hpAmount * TARGET_PEG) / (10**HP_DECIMALS);
    }
    
    /**
     * @dev Get comprehensive contract status
     */
    function getContractStatus() external view returns (
        uint256 totalSupplyHP,
        uint256 totalCollateralUSDT,
        uint256 backingRatio,
        uint256 effectivePeg,
        uint256 currentCollateralRatio,
        uint256 stabilityFundBalance
    ) {
        totalSupplyHP = totalSupply();
        totalCollateralUSDT = totalCollateral;
        stabilityFundBalance = stabilityFund;
        effectivePeg = getCurrentEffectivePeg();
        currentCollateralRatio = getCurrentCollateralRatio();
        
        if (totalSupplyHP > 0) {
            uint256 totalValue = (totalSupplyHP * TARGET_PEG) / (10**HP_DECIMALS);
            backingRatio = (totalCollateral * 100) / totalValue;
        }
    }
    
    // Administrative functions
    
    function updateStabilityParameters(
        uint256 _pegAdjustmentFactor,
        uint256 _stabilityBuffer,
        uint256 _rebalanceThreshold
    ) external onlyOwner {
        pegAdjustmentFactor = _pegAdjustmentFactor;
        stabilityBuffer = _stabilityBuffer;
        rebalanceThreshold = _rebalanceThreshold;
    }
    
    function depositStabilityFund(uint256 amount) external onlyOwner {
        require(USDT.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stabilityFund += amount;
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
        emit EmergencyAction("emergencyWithdraw", amount);
    }
    
    // Override transfers to add pause functionality
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}

// Math library for safe operations
library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
}