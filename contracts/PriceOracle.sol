// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IVVSPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IWCROOracle {
    function latestAnswer() external view returns (int256);
}

/**
 * @title PriceOracle
 * @dev Contract for fetching AUT token price from VVS Finance on Cronos Chain
 */
contract PriceOracle is Ownable {
    using SafeMath for uint256;

    // Constants
    uint256 public constant PRICE_PRECISION = 10 ** 30;
    uint256 public constant WCRO_PRICE_PRECISION = 10 ** 8; // 8 decimals for WCRO/USD price
    uint256 public constant TWAP_PERIOD = 30 minutes; // 30-minute TWAP window
    uint256 public constant MAX_PRICE_AGE = 1 hours; // Maximum age of price data

    // Price data structure
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool isValid;
    }

    // TWAP data structure
    struct TWAPData {
        uint256 cumulativePrice;
        uint256 timestamp;
    }

    // Price feed addresses
    address public vvsPoolAddress; // VVS Finance AUT/WCRO pool
    address public wcroUsdOracle;  // WCRO/USD price oracle
    address public autToken;       // AUT token address
    address public wcroToken;      // WCRO token address

    // Current price data
    PriceData public currentPrice;

    // TWAP data
    TWAPData[] public twapData;
    uint256 public twapUpdateInterval = 5 minutes;
    uint256 public lastTwapUpdateTime;

    // Events
    event PriceUpdated(uint256 price, uint256 timestamp);
    event TWAPUpdated(uint256 price);
    event PoolAddressUpdated(address newPoolAddress);
    event WCROOracleUpdated(address newOracleAddress);

    /**
     * @dev Constructor
     * @param _vvsPoolAddress VVS Finance AUT/WCRO pool address
     * @param _wcroUsdOracle WCRO/USD price oracle address
     * @param _autToken AUT token address
     * @param _wcroToken WCRO token address
     */
    constructor(
        address _vvsPoolAddress,
        address _wcroUsdOracle,
        address _autToken,
        address _wcroToken
    ) {
        require(_vvsPoolAddress != address(0), "Invalid VVS pool address");
        require(_wcroUsdOracle != address(0), "Invalid WCRO oracle address");
        require(_autToken != address(0), "Invalid AUT token address");
        require(_wcroToken != address(0), "Invalid WCRO token address");
        
        vvsPoolAddress = _vvsPoolAddress;
        wcroUsdOracle = _wcroUsdOracle;
        autToken = _autToken;
        wcroToken = _wcroToken;
        
        // Initialize TWAP data
        lastTwapUpdateTime = block.timestamp;
        updatePrice();
    }

    /**
     * @dev Set VVS pool address
     * @param _vvsPoolAddress New VVS pool address
     */
    function setVVSPoolAddress(address _vvsPoolAddress) external onlyOwner {
        require(_vvsPoolAddress != address(0), "Invalid VVS pool address");
        vvsPoolAddress = _vvsPoolAddress;
        emit PoolAddressUpdated(_vvsPoolAddress);
    }

    /**
     * @dev Set WCRO/USD oracle address
     * @param _wcroUsdOracle New WCRO/USD oracle address
     */
    function setWCROOracle(address _wcroUsdOracle) external onlyOwner {
        require(_wcroUsdOracle != address(0), "Invalid WCRO oracle address");
        wcroUsdOracle = _wcroUsdOracle;
        emit WCROOracleUpdated(_wcroUsdOracle);
    }

    /**
     * @dev Set TWAP update interval
     * @param _interval New update interval in seconds
     */
    function setTWAPUpdateInterval(uint256 _interval) external onlyOwner {
        require(_interval > 0, "Interval must be > 0");
        twapUpdateInterval = _interval;
    }

    /**
     * @dev Update price data
     * @return price Current AUT price in USD with PRICE_PRECISION decimals
     */
    function updatePrice() public returns (uint256) {
        // Get reserves from VVS pool
        (uint112 reserve0, uint112 reserve1, ) = IVVSPair(vvsPoolAddress).getReserves();
        
        // Determine which token is AUT and which is WCRO
        bool isAUTToken0 = IVVSPair(vvsPoolAddress).token0() == autToken;
        
        uint256 autReserve;
        uint256 wcroReserve;
        
        if (isAUTToken0) {
            autReserve = uint256(reserve0);
            wcroReserve = uint256(reserve1);
        } else {
            autReserve = uint256(reserve1);
            wcroReserve = uint256(reserve0);
        }
        
        // Calculate AUT/WCRO price
        uint256 autWcroPrice = wcroReserve.mul(PRICE_PRECISION).div(autReserve);
        
        // Get WCRO/USD price from oracle
        int256 wcroUsdPriceRaw = IWCROOracle(wcroUsdOracle).latestAnswer();
        require(wcroUsdPriceRaw > 0, "Invalid WCRO/USD price");
        uint256 wcroUsdPrice = uint256(wcroUsdPriceRaw);
        
        // Calculate AUT/USD price
        uint256 autUsdPrice = autWcroPrice.mul(wcroUsdPrice).div(WCRO_PRICE_PRECISION);
        
        // Update current price data
        currentPrice = PriceData({
            price: autUsdPrice,
            timestamp: block.timestamp,
            isValid: true
        });
        
        // Update TWAP data if interval has passed
        if (block.timestamp >= lastTwapUpdateTime.add(twapUpdateInterval)) {
            updateTWAP(autUsdPrice);
        }
        
        emit PriceUpdated(autUsdPrice, block.timestamp);
        
        return autUsdPrice;
    }

    /**
     * @dev Update TWAP data
     * @param _currentPrice Current price to add to TWAP
     */
    function updateTWAP(uint256 _currentPrice) internal {
        // Add new data point
        twapData.push(TWAPData({
            cumulativePrice: _currentPrice,
            timestamp: block.timestamp
        }));
        
        // Remove old data points outside TWAP period
        uint256 cutoffTime = block.timestamp.sub(TWAP_PERIOD);
        uint256 i = 0;
        
        while (i < twapData.length && twapData[i].timestamp < cutoffTime) {
            i++;
        }
        
        if (i > 0) {
            // Remove old data points
            for (uint256 j = 0; j < twapData.length - i; j++) {
                twapData[j] = twapData[j + i];
            }
            
            // Resize array
            for (uint256 j = 0; j < i; j++) {
                twapData.pop();
            }
        }
        
        lastTwapUpdateTime = block.timestamp;
        
        // Calculate and emit TWAP
        uint256 twapPrice = getTWAP();
        emit TWAPUpdated(twapPrice);
    }

    /**
     * @dev Get current price
     * @return price Current AUT price in USD with PRICE_PRECISION decimals
     */
    function getPrice() external view returns (uint256) {
        require(currentPrice.isValid, "Price not initialized");
        require(block.timestamp <= currentPrice.timestamp.add(MAX_PRICE_AGE), "Price data too old");
        
        return currentPrice.price;
    }

    /**
     * @dev Get TWAP price
     * @return twapPrice Time-weighted average price
     */
    function getTWAP() public view returns (uint256) {
        require(twapData.length > 0, "No TWAP data available");
        
        if (twapData.length == 1) {
            return twapData[0].cumulativePrice;
        }
        
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 1; i < twapData.length; i++) {
            uint256 timeWeight = twapData[i].timestamp.sub(twapData[i-1].timestamp);
            weightedSum = weightedSum.add(twapData[i-1].cumulativePrice.mul(timeWeight));
            totalWeight = totalWeight.add(timeWeight);
        }
        
        // Add the most recent price point weighted by time since last update
        uint256 lastTimeWeight = block.timestamp.sub(twapData[twapData.length-1].timestamp);
        weightedSum = weightedSum.add(twapData[twapData.length-1].cumulativePrice.mul(lastTimeWeight));
        totalWeight = totalWeight.add(lastTimeWeight);
        
        return weightedSum.div(totalWeight);
    }

    /**
     * @dev Force update TWAP data
     */
    function forceUpdateTWAP() external onlyOwner {
        require(currentPrice.isValid, "Price not initialized");
        updateTWAP(currentPrice.price);
    }

    /**
     * @dev Check if price needs update
     * @return needsUpdate Whether price needs to be updated
     */
    function needsUpdate() external view returns (bool) {
        return !currentPrice.isValid || block.timestamp > currentPrice.timestamp.add(MAX_PRICE_AGE);
    }
}
