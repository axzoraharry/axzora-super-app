// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Chainlink price feed interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 price, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * @title HappyPaisaTokenOracle (HP)
 * @dev A collateral-backed stable token pegged to 1000 INR with real-time USDT conversion
 * Uses Chainlink price feeds for accurate INR/USD conversion
 */
contract HappyPaisaTokenOracle is ERC20, Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable USDT;
    
    // Chainlink price feeds
    AggregatorV3Interface public immutable usdInrPriceFeed;
    
    // Constants
    uint256 public constant HP_DECIMALS = 18;
    uint256 public constant INR_EQUIVALENT = 1000; // 1000 INR per HP
    uint256 public constant USDT_DECIMALS = 6;
    
    // Collateral tracking
    uint256 public totalCollateral; // Total USDT collateral
    uint256 public reserveRatio = 110; // 110% collateralization ratio
    
    // Price feed settings
    uint256 public maxPriceAge = 3600; // 1 hour max age for price data
    uint256 public fallbackUsdtRate = 12 * 10**6; // Fallback rate if oracle fails
    
    // Events
    event TokensMinted(address indexed to, uint256 hpAmount, uint256 usdtCollateral, uint256 inrValue, uint256 usdtRate);
    event TokensBurned(address indexed from, uint256 hpAmount, uint256 usdtReturned, uint256 inrValue, uint256 usdtRate);
    event CollateralDeposited(address indexed depositor, uint256 amount);
    event CollateralWithdrawn(address indexed withdrawer, uint256 amount);
    event ReserveRatioUpdated(uint256 oldRatio, uint256 newRatio);
    event PriceDataUpdated(uint256 newRate, uint256 timestamp);
    event FallbackRateUpdated(uint256 oldRate, uint256 newRate);
    event MaxPriceAgeUpdated(uint256 oldAge, uint256 newAge);
    
    constructor(
        address _usdtAddress,
        address _usdInrPriceFeed
    ) ERC20("Happy Paisa Token Oracle", "HP") Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        require(_usdInrPriceFeed != address(0), "Invalid price feed address");
        
        USDT = IERC20(_usdtAddress);
        usdInrPriceFeed = AggregatorV3Interface(_usdInrPriceFeed);
    }
    
    /**
     * @dev Get current USDT equivalent of 1000 INR using Chainlink oracle
     * @return USDT amount (with 6 decimals) equivalent to 1000 INR
     */
    function getCurrentUSDTRate() public view returns (uint256) {
        try this.getLatestPrice() returns (uint256 usdInrRate, uint256 timestamp) {
            // Check if price data is fresh
            if (block.timestamp - timestamp > maxPriceAge) {
                return fallbackUsdtRate; // Use fallback if data is stale
            }
            
            // Convert: 1000 INR to USD, then to USDT (6 decimals)
            // usdInrRate is already in proper format from getLatestPrice()
            uint256 usdAmount = (INR_EQUIVALENT * 10**8) / usdInrRate; // Convert to USD (8 decimals)
            uint256 usdtAmount = (usdAmount * 10**USDT_DECIMALS) / 10**8; // Convert to USDT (6 decimals)
            
            return usdtAmount;
        } catch {
            return fallbackUsdtRate; // Use fallback if oracle call fails
        }
    }
    
    /**
     * @dev Get latest price from Chainlink oracle
     * @return usdInrRate USD/INR rate with 8 decimals
     * @return timestamp Last update timestamp
     */
    function getLatestPrice() external view returns (uint256 usdInrRate, uint256 timestamp) {
        (, int256 price, , uint256 updatedAt, ) = usdInrPriceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        
        return (uint256(price), updatedAt);
    }
    
    /**
     * @dev Mint HP tokens by depositing USDT collateral
     * @param hpAmount Amount of HP tokens to mint
     */
    function mintTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        
        // Get current USDT rate for 1000 INR
        uint256 currentRate = getCurrentUSDTRate();
        
        // Calculate required USDT collateral (with reserve ratio)
        uint256 baseCollateral = (hpAmount * currentRate) / 10**HP_DECIMALS;
        uint256 requiredCollateral = (baseCollateral * reserveRatio) / 100;
        
        // Calculate INR equivalent for event
        uint256 inrValue = (hpAmount * INR_EQUIVALENT) / 10**(HP_DECIMALS - 3);
        
        // Transfer USDT from user
        require(
            USDT.transferFrom(msg.sender, address(this), requiredCollateral),
            "USDT transfer failed"
        );
        
        // Update collateral tracking
        totalCollateral += requiredCollateral;
        
        // Mint HP tokens
        _mint(msg.sender, hpAmount);
        
        emit TokensMinted(msg.sender, hpAmount, requiredCollateral, inrValue, currentRate);
    }
    
    /**
     * @dev Burn HP tokens and return USDT collateral
     * @param hpAmount Amount of HP tokens to burn
     */
    function burnTokens(uint256 hpAmount) external nonReentrant whenNotPaused {
        require(hpAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= hpAmount, "Insufficient HP balance");
        
        // Get current USDT rate for 1000 INR
        uint256 currentRate = getCurrentUSDTRate();
        
        // Calculate USDT to return (at base rate, not reserve ratio)
        uint256 usdtToReturn = (hpAmount * currentRate) / 10**HP_DECIMALS;
        
        // Calculate INR equivalent for event
        uint256 inrValue = (hpAmount * INR_EQUIVALENT) / 10**(HP_DECIMALS - 3);
        
        require(totalCollateral >= usdtToReturn, "Insufficient collateral");
        require(USDT.balanceOf(address(this)) >= usdtToReturn, "Insufficient USDT balance");
        
        // Update collateral tracking
        totalCollateral -= usdtToReturn;
        
        // Burn HP tokens
        _burn(msg.sender, hpAmount);
        
        // Return USDT
        require(USDT.transfer(msg.sender, usdtToReturn), "USDT transfer failed");
        
        emit TokensBurned(msg.sender, hpAmount, usdtToReturn, inrValue, currentRate);
    }
    
    /**
     * @dev Calculate how much USDT is needed to mint a specific amount of HP
     * @param hpAmount Amount of HP tokens to mint
     * @return Required USDT amount
     */
    function calculateCollateralNeeded(uint256 hpAmount) external view returns (uint256) {
        uint256 currentRate = getCurrentUSDTRate();
        uint256 baseCollateral = (hpAmount * currentRate) / 10**HP_DECIMALS;
        return (baseCollateral * reserveRatio) / 100;
    }
    
    /**
     * @dev Calculate how much USDT will be returned when burning HP
     * @param hpAmount Amount of HP tokens to burn
     * @return USDT amount to be returned
     */
    function calculateUSDTReturn(uint256 hpAmount) external view returns (uint256) {
        uint256 currentRate = getCurrentUSDTRate();
        return (hpAmount * currentRate) / 10**HP_DECIMALS;
    }
    
    /**
     * @dev Get comprehensive contract info including real-time rates
     */
    function getContractInfo() external view returns (
        uint256 totalSupplyHP,
        uint256 totalCollateralUSDT,
        uint256 currentReserveRatio,
        uint256 currentCollateralizationRatio,
        uint256 totalINRValue,
        uint256 currentUsdtRate,
        uint256 priceTimestamp,
        bool isOracleActive
    ) {
        totalSupplyHP = totalSupply();
        totalCollateralUSDT = totalCollateral;
        currentReserveRatio = reserveRatio;
        currentUsdtRate = getCurrentUSDTRate();
        
        // Get price timestamp
        try this.getLatestPrice() returns (uint256, uint256 timestamp) {
            priceTimestamp = timestamp;
            isOracleActive = (block.timestamp - timestamp) <= maxPriceAge;
        } catch {
            priceTimestamp = 0;
            isOracleActive = false;
        }
        
        // Calculate total INR value
        totalINRValue = (totalSupplyHP * INR_EQUIVALENT) / 10**(HP_DECIMALS - 3);
        
        if (totalSupplyHP == 0) {
            currentCollateralizationRatio = 0;
        } else {
            uint256 baseValue = (totalSupplyHP * currentUsdtRate) / 10**HP_DECIMALS;
            currentCollateralizationRatio = baseValue == 0 ? 0 : (totalCollateral * 100) / baseValue;
        }
    }
    
    // Owner functions
    function depositCollateral(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        require(
            USDT.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
        
        totalCollateral += amount;
        emit CollateralDeposited(msg.sender, amount);
    }
    
    function updateReserveRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Reserve ratio must be at least 100%");
        require(newRatio <= 200, "Reserve ratio cannot exceed 200%");
        
        uint256 oldRatio = reserveRatio;
        reserveRatio = newRatio;
        emit ReserveRatioUpdated(oldRatio, newRatio);
    }
    
    function updateFallbackRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be greater than 0");
        uint256 oldRate = fallbackUsdtRate;
        fallbackUsdtRate = newRate;
        emit FallbackRateUpdated(oldRate, newRate);
    }
    
    function updateMaxPriceAge(uint256 newAge) external onlyOwner {
        require(newAge > 300, "Age must be at least 5 minutes"); // Minimum 5 minutes
        require(newAge < 86400, "Age cannot exceed 24 hours"); // Maximum 24 hours
        uint256 oldAge = maxPriceAge;
        maxPriceAge = newAge;
        emit MaxPriceAgeUpdated(oldAge, newAge);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override transfer functions
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}