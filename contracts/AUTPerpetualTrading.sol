// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AUTPerpetualTrading
 * @dev Main contract for AUT token perpetual trading platform
 */
contract AUTPerpetualTrading is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant FUNDING_RATE_PRECISION = 1000000;
    uint256 public constant PRICE_PRECISION = 10 ** 30;
    uint256 public constant MIN_LEVERAGE = 10000; // 1x
    uint256 public constant MAX_LEVERAGE = 100000; // 10x
    uint256 public constant MAX_FEE_BASIS_POINTS = 500; // 5%
    uint256 public constant MAX_LIQUIDATION_FEE_USD = 100 * PRICE_PRECISION; // 100 USD
    uint256 public constant MIN_FUNDING_RATE_INTERVAL = 8 hours;
    uint256 public constant MAX_FUNDING_RATE_FACTOR = 10000; // 1%

    // Position struct
    struct Position {
        uint256 size;             // Position size in USD
        uint256 collateral;       // Collateral amount in USD
        uint256 averagePrice;     // Entry price
        uint256 entryFundingRate; // Funding rate at position entry
        uint256 reserveAmount;    // Reserved tokens for the position
        int256 realisedPnl;       // Realized profit and loss
        uint256 lastIncreasedTime; // Last time position was increased
    }

    // Contract state variables
    bool public isInitialized;
    bool public isLeverageEnabled = true;

    address public aut; // AUT token address
    address public priceFeed; // Price feed address
    address public positionManager; // Position manager address
    address public collateralVault; // Collateral vault address
    address public feeDistributor; // Fee distributor address

    uint256 public liquidationFeeUsd;
    uint256 public marginFeeBasisPoints = 10; // 0.1%
    uint256 public minProfitTime;
    uint256 public fundingInterval = 8 hours;
    uint256 public fundingRateFactor;

    // Funding rates
    mapping(bool => uint256) public cumulativeFundingRates; // isLong => funding rate
    uint256 public lastFundingTime;

    // Positions mapping: keccak256(trader, isLong) => Position
    mapping(bytes32 => Position) public positions;

    // Open interest tracking
    uint256 public longOpenInterest;
    uint256 public shortOpenInterest;

    // Insurance fund
    uint256 public insuranceFundSize;

    // Events
    event PositionOpened(
        address indexed trader,
        uint256 indexed positionId,
        bool isLong,
        uint256 size,
        uint256 collateral,
        uint256 entryPrice,
        uint256 leverage,
        uint256 liquidationPrice
    );

    event PositionClosed(
        address indexed trader,
        uint256 indexed positionId,
        uint256 exitPrice,
        int256 pnl
    );

    event PositionLiquidated(
        address indexed trader,
        uint256 indexed positionId,
        uint256 liquidationPrice
    );

    event FundingPaid(
        uint256 timestamp,
        int256 fundingRate,
        uint256 longOpenInterest,
        uint256 shortOpenInterest
    );

    /**
     * @dev Constructor
     * @param _aut AUT token address
     */
    constructor(address _aut) {
        require(_aut != address(0), "Invalid AUT address");
        aut = _aut;
    }

    /**
     * @dev Initialize the contract with required parameters
     * @param _priceFeed Price feed address
     * @param _positionManager Position manager address
     * @param _collateralVault Collateral vault address
     * @param _feeDistributor Fee distributor address
     * @param _liquidationFeeUsd Liquidation fee in USD
     * @param _fundingRateFactor Funding rate factor
     */
    function initialize(
        address _priceFeed,
        address _positionManager,
        address _collateralVault,
        address _feeDistributor,
        uint256 _liquidationFeeUsd,
        uint256 _fundingRateFactor
    ) external onlyOwner {
        require(!isInitialized, "Already initialized");
        require(_priceFeed != address(0), "Invalid price feed address");
        require(_positionManager != address(0), "Invalid position manager address");
        require(_collateralVault != address(0), "Invalid collateral vault address");
        require(_feeDistributor != address(0), "Invalid fee distributor address");
        require(_liquidationFeeUsd <= MAX_LIQUIDATION_FEE_USD, "Liquidation fee too high");
        require(_fundingRateFactor <= MAX_FUNDING_RATE_FACTOR, "Funding rate factor too high");

        isInitialized = true;
        priceFeed = _priceFeed;
        positionManager = _positionManager;
        collateralVault = _collateralVault;
        feeDistributor = _feeDistributor;
        liquidationFeeUsd = _liquidationFeeUsd;
        fundingRateFactor = _fundingRateFactor;
        lastFundingTime = block.timestamp;
    }

    /**
     * @dev Opens a new trading position
     * @param _isLong Whether the position is long (true) or short (false)
     * @param _collateralAmount Amount of AUT tokens to use as collateral
     * @param _leverage Leverage multiplier (1-10x)
     * @return positionId ID of the newly created position
     */
    function openPosition(
        bool _isLong,
        uint256 _collateralAmount,
        uint256 _leverage
    ) external nonReentrant returns (uint256) {
        require(isInitialized, "Not initialized");
        require(isLeverageEnabled, "Leverage trading disabled");
        require(_leverage >= MIN_LEVERAGE && _leverage <= MAX_LEVERAGE, "Invalid leverage");
        require(_collateralAmount > 0, "Collateral must be > 0");

        // Transfer collateral from user to vault
        IERC20(aut).safeTransferFrom(msg.sender, collateralVault, _collateralAmount);

        // Get AUT price from oracle
        uint256 autPrice = getAUTPrice();
        
        // Calculate position size in USD
        uint256 collateralValueUsd = _collateralAmount.mul(autPrice).div(10**18);
        uint256 positionSizeUsd = collateralValueUsd.mul(_leverage).div(MIN_LEVERAGE);

        // Calculate liquidation price
        uint256 liquidationPrice;
        if (_isLong) {
            // For longs: liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMargin)
            // Maintenance margin is 5%
            liquidationPrice = autPrice.mul(BASIS_POINTS_DIVISOR.sub(BASIS_POINTS_DIVISOR.div(_leverage).add(500))).div(BASIS_POINTS_DIVISOR);
        } else {
            // For shorts: liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMargin)
            liquidationPrice = autPrice.mul(BASIS_POINTS_DIVISOR.add(BASIS_POINTS_DIVISOR.div(_leverage).sub(500))).div(BASIS_POINTS_DIVISOR);
        }

        // Calculate fees
        uint256 feeBasisPoints = marginFeeBasisPoints;
        uint256 feeUsd = positionSizeUsd.mul(feeBasisPoints).div(BASIS_POINTS_DIVISOR);
        uint256 feeAmount = feeUsd.mul(10**18).div(autPrice);

        // Deduct fee from collateral
        _collateralAmount = _collateralAmount.sub(feeAmount);
        
        // Send fee to fee distributor
        IERC20(aut).safeTransfer(feeDistributor, feeAmount);

        // Update funding rate
        updateCumulativeFundingRate();

        // Create position
        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, _isLong));
        Position storage position = positions[positionKey];

        // If position already exists, update it
        if (position.size > 0) {
            // Calculate new average price
            position.averagePrice = (position.averagePrice.mul(position.size).add(autPrice.mul(positionSizeUsd)))
                .div(position.size.add(positionSizeUsd));
            
            position.size = position.size.add(positionSizeUsd);
            position.collateral = position.collateral.add(collateralValueUsd);
            position.lastIncreasedTime = block.timestamp;
        } else {
            // Create new position
            position.size = positionSizeUsd;
            position.collateral = collateralValueUsd;
            position.averagePrice = autPrice;
            position.entryFundingRate = cumulativeFundingRates[_isLong];
            position.lastIncreasedTime = block.timestamp;
        }

        // Update open interest
        if (_isLong) {
            longOpenInterest = longOpenInterest.add(positionSizeUsd);
        } else {
            shortOpenInterest = shortOpenInterest.add(positionSizeUsd);
        }

        // Generate position ID (for event)
        uint256 positionId = uint256(positionKey);

        emit PositionOpened(
            msg.sender,
            positionId,
            _isLong,
            positionSizeUsd,
            collateralValueUsd,
            autPrice,
            _leverage,
            liquidationPrice
        );

        return positionId;
    }

    /**
     * @dev Closes an existing position
     * @param _isLong Whether the position is long (true) or short (false)
     * @return pnl Profit or loss from the position (negative for losses)
     */
    function closePosition(bool _isLong) external nonReentrant returns (int256) {
        require(isInitialized, "Not initialized");

        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, _isLong));
        Position storage position = positions[positionKey];
        
        require(position.size > 0, "Position not found");

        // Update funding rate
        updateCumulativeFundingRate();

        // Get AUT price from oracle
        uint256 autPrice = getAUTPrice();

        // Calculate PnL
        int256 pnl;
        if (_isLong) {
            // For longs: (currentPrice - entryPrice) / entryPrice * size
            if (autPrice > position.averagePrice) {
                // Profit
                pnl = int256(autPrice.sub(position.averagePrice).mul(position.size).div(position.averagePrice));
            } else {
                // Loss
                pnl = -int256(position.averagePrice.sub(autPrice).mul(position.size).div(position.averagePrice));
            }
        } else {
            // For shorts: (entryPrice - currentPrice) / entryPrice * size
            if (position.averagePrice > autPrice) {
                // Profit
                pnl = int256(position.averagePrice.sub(autPrice).mul(position.size).div(position.averagePrice));
            } else {
                // Loss
                pnl = -int256(autPrice.sub(position.averagePrice).mul(position.size).div(position.averagePrice));
            }
        }

        // Calculate funding fee
        uint256 fundingFee = getFundingFee(position.size, position.entryFundingRate, _isLong);
        
        // Deduct funding fee from PnL
        pnl = pnl - int256(fundingFee);

        // Calculate collateral to return
        uint256 collateralToReturn;
        if (pnl > 0) {
            // Profit: return collateral + profit
            collateralToReturn = position.collateral + uint256(pnl);
        } else {
            // Loss: return collateral - loss (if possible)
            uint256 loss = uint256(-pnl);
            if (loss >= position.collateral) {
                // Loss exceeds collateral, return 0
                collateralToReturn = 0;
            } else {
                // Return remaining collateral
                collateralToReturn = position.collateral - loss;
            }
        }

        // Calculate AUT amount to return
        uint256 autAmount = collateralToReturn.mul(10**18).div(autPrice);

        // Update open interest
        if (_isLong) {
            longOpenInterest = longOpenInterest.sub(position.size);
        } else {
            shortOpenInterest = shortOpenInterest.sub(position.size);
        }

        // Generate position ID (for event)
        uint256 positionId = uint256(positionKey);

        // Delete position
        delete positions[positionKey];

        // Transfer AUT from vault to user
        if (autAmount > 0) {
            // Call vault to transfer tokens
            (bool success, ) = collateralVault.call(
                abi.encodeWithSignature("transferToken(address,address,uint256)", aut, msg.sender, autAmount)
            );
            require(success, "Transfer from vault failed");
        }

        emit PositionClosed(msg.sender, positionId, autPrice, pnl);

        return pnl;
    }

    /**
     * @dev Liquidates a position that has reached its liquidation price
     * @param _trader Address of the trader
     * @param _isLong Whether the position is long (true) or short (false)
     */
    function liquidatePosition(address _trader, bool _isLong) external nonReentrant {
        require(isInitialized, "Not initialized");

        bytes32 positionKey = keccak256(abi.encodePacked(_trader, _isLong));
        Position storage position = positions[positionKey];
        
        require(position.size > 0, "Position not found");

        // Get AUT price from oracle
        uint256 autPrice = getAUTPrice();

        // Check if position can be liquidated
        bool canLiquidate;
        uint256 liquidationPrice;
        
        if (_isLong) {
            // For longs: liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMargin)
            // Leverage = size / collateral
            uint256 leverage = position.size.mul(BASIS_POINTS_DIVISOR).div(position.collateral);
            liquidationPrice = position.averagePrice.mul(
                BASIS_POINTS_DIVISOR.sub(BASIS_POINTS_DIVISOR.div(leverage).add(500))
            ).div(BASIS_POINTS_DIVISOR);
            
            canLiquidate = autPrice <= liquidationPrice;
        } else {
            // For shorts: liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMargin)
            uint256 leverage = position.size.mul(BASIS_POINTS_DIVISOR).div(position.collateral);
            liquidationPrice = position.averagePrice.mul(
                BASIS_POINTS_DIVISOR.add(BASIS_POINTS_DIVISOR.div(leverage).sub(500))
            ).div(BASIS_POINTS_DIVISOR);
            
            canLiquidate = autPrice >= liquidationPrice;
        }

        require(canLiquidate, "Cannot liquidate position");

        // Update funding rate
        updateCumulativeFundingRate();

        // Calculate liquidation fee
        uint256 liquidationFeeAmount = liquidationFeeUsd.mul(10**18).div(autPrice);

        // Update open interest
        if (_isLong) {
            longOpenInterest = longOpenInterest.sub(position.size);
        } else {
            shortOpenInterest = shortOpenInterest.sub(position.size);
        }

        // Generate position ID (for event)
        uint256 positionId = uint256(positionKey);

        // Delete position
        delete positions[positionKey];

        // Transfer liquidation fee to liquidator
        (bool success, ) = collateralVault.call(
            abi.encodeWithSignature("transferToken(address,address,uint256)", aut, msg.sender, liquidationFeeAmount)
        );
        require(success, "Transfer liquidation fee failed");

        emit PositionLiquidated(_trader, positionId, liquidationPrice);
    }

    /**
     * @dev Updates the funding rate based on long/short imbalance
     * @return newFundingRate The new funding rate
     */
    function updateFundingRate() external returns (int256) {
        require(isInitialized, "Not initialized");
        require(block.timestamp >= lastFundingTime.add(fundingInterval), "Funding interval not elapsed");

        return _updateFundingRate();
    }

    /**
     * @dev Internal function to update funding rate
     * @return newFundingRate The new funding rate
     */
    function _updateFundingRate() internal returns (int256) {
        if (block.timestamp < lastFundingTime.add(fundingInterval)) {
            return 0;
        }

        // Calculate number of intervals elapsed
        uint256 intervals = block.timestamp.sub(lastFundingTime).div(fundingInterval);
        
        // Calculate funding rate based on long/short imbalance
        int256 fundingRate = 0;
        
        if (longOpenInterest > 0 || shortOpenInterest > 0) {
            // If more longs than shorts, longs pay shorts
            // If more shorts than longs, shorts pay longs
            if (longOpenInterest > shortOpenInterest) {
                uint256 imbalance = longOpenInterest.sub(shortOpenInterest).mul(FUNDING_RATE_PRECISION).div(longOpenInterest);
                fundingRate = int256(imbalance.mul(fundingRateFactor).div(BASIS_POINTS_DIVISOR));
            } else if (shortOpenInterest > longOpenInterest) {
                uint256 imbalance = shortOpenInterest.sub(longOpenInterest).mul(FUNDING_RATE_PRECISION).div(shortOpenInterest);
                fundingRate = -int256(imbalance.mul(fundingRateFactor).div(BASIS_POINTS_DIVISOR));
            }
        }

        // Update cumulative funding rates
        if (fundingRate > 0) {
            cumulativeFundingRates[true] = cumulativeFundingRates[true].add(uint256(fundingRate).mul(intervals));
        } else if (fundingRate < 0) {
            cumulativeFundingRates[false] = cumulativeFundingRates[false].add(uint256(-fundingRate).mul(intervals));
        }

        lastFundingTime = block.timestamp;

        emit FundingPaid(block.timestamp, fundingRate, longOpenInterest, shortOpenInterest);

        return fundingRate;
    }

    /**
     * @dev Updates the cumulative funding rate if needed
     */
    function updateCumulativeFundingRate() public {
        if (block.timestamp >= lastFundingTime.add(fundingInterval)) {
            _updateFundingRate();
        }
    }

    /**
     * @dev Gets the current AUT token price from the oracle
     * @return price Current price of AUT token
     */
    function getAUTPrice() public view returns (uint256) {
        require(priceFeed != address(0), "Price feed not set");
        
        // Call price feed to get AUT price
        (bool success, bytes memory data) = priceFeed.staticcall(
            abi.encodeWithSignature("getPrice()")
        );
        require(success, "Price feed call failed");
        
        return abi.decode(data, (uint256));
    }

    /**
     * @dev Gets the details of a position
     * @param _trader Address of the trader
     * @param _isLong Whether the position is long (true) or short (false)
     * @return position Position details
     */
    function getPosition(address _trader, bool _isLong) external view returns (
        uint256 size,
        uint256 collateral,
        uint256 averagePrice,
        uint256 entryFundingRate,
        uint256 lastIncreasedTime
    ) {
        bytes32 positionKey = keccak256(abi.encodePacked(_trader, _isLong));
        Position storage position = positions[positionKey];
        
        return (
            position.size,
            position.collateral,
            position.averagePrice,
            position.entryFundingRate,
            position.lastIncreasedTime
        );
    }

    /**
     * @dev Calculates the current profit or loss for a position
     * @param _trader Address of the trader
     * @param _isLong Whether the position is long (true) or short (false)
     * @return pnl Current profit or loss (negative for losses)
     */
    function calculatePnL(address _trader, bool _isLong) external view returns (int256) {
        bytes32 positionKey = keccak256(abi.encodePacked(_trader, _isLong));
        Position storage position = positions[positionKey];
        
        if (position.size == 0) {
            return 0;
        }

        uint256 autPrice = getAUTPrice();
        
        int256 pnl;
        if (_isLong) {
            // For longs: (currentPrice - entryPrice) / entryPrice * size
            if (autPrice > position.averagePrice) {
                // Profit
                pnl = int256(autPrice.sub(position.averagePrice).mul(position.size).div(position.averagePrice));
            } else {
                // Loss
                pnl = -int256(position.averagePrice.sub(autPrice).mul(position.size).div(position.averagePrice));
            }
        } else {
            // For shorts: (entryPrice - currentPrice) / entryPrice * size
            if (position.averagePrice > autPrice) {
                // Profit
                pnl = int256(position.averagePrice.sub(autPrice).mul(position.size).div(position.averagePrice));
            } else {
                // Loss
                pnl = -int256(autPrice.sub(position.averagePrice).mul(position.size).div(position.averagePrice));
            }
        }

        // Deduct funding fee
        uint256 fundingFee = getFundingFee(position.size, position.entryFundingRate, _isLong);
        pnl = pnl - int256(fundingFee);

        return pnl;
    }

    /**
     * @dev Gets the current funding rate
     * @return fundingRate Current funding rate (positive means longs pay shorts)
     */
    function getCurrentFundingRate() external view returns (int256) {
        if (longOpenInterest == 0 && shortOpenInterest == 0) {
            return 0;
        }

        if (longOpenInterest > shortOpenInterest) {
            uint256 imbalance = longOpenInterest.sub(shortOpenInterest).mul(FUNDING_RATE_PRECISION).div(longOpenInterest);
            return int256(imbalance.mul(fundingRateFactor).div(BASIS_POINTS_DIVISOR));
        } else if (shortOpenInterest > longOpenInterest) {
            uint256 imbalance = shortOpenInterest.sub(longOpenInterest).mul(FUNDING_RATE_PRECISION).div(shortOpenInterest);
            return -int256(imbalance.mul(fundingRateFactor).div(BASIS_POINTS_DIVISOR));
        }

        return 0;
    }

    /**
     * @dev Calculates the funding fee for a position
     * @param _size Position size
     * @param _entryFundingRate Funding rate at position entry
     * @param _isLong Whether the position is long (true) or short (false)
     * @return fee Funding fee
     */
    function getFundingFee(
        uint256 _size,
        uint256 _entryFundingRate,
        bool _isLong
    ) public view returns (uint256) {
        uint256 fundingRate = cumulativeFundingRates[_isLong].sub(_entryFundingRate);
        return _size.mul(fundingRate).div(FUNDING_RATE_PRECISION);
    }

    /**
     * @dev Gets the total open interest for long positions
     * @return openInterest Total size of all long positions
     */
    function getLongOpenInterest() external view returns (uint256) {
        return longOpenInterest;
    }

    /**
     * @dev Gets the total open interest for short positions
     * @return openInterest Total size of all short positions
     */
    function getShortOpenInterest() external view returns (uint256) {
        return shortOpenInterest;
    }

    /**
     * @dev Gets the size of the insurance fund
     * @return size Current size of the insurance fund in AUT tokens
     */
    function getInsuranceFundSize() external view returns (uint256) {
        return insuranceFundSize;
    }

    /**
     * @dev Sets the leverage enabled flag
     * @param _isEnabled Whether leverage trading is enabled
     */
    function setLeverageEnabled(bool _isEnabled) external onlyOwner {
        isLeverageEnabled = _isEnabled;
    }

    /**
     * @dev Sets the funding interval
     * @param _fundingInterval New funding interval in seconds
     */
    function setFundingInterval(uint256 _fundingInterval) external onlyOwner {
        require(_fundingInterval >= MIN_FUNDING_RATE_INTERVAL, "Funding interval too short");
        fundingInterval = _fundingInterval;
    }

    /**
     * @dev Sets the funding rate factor
     * @param _fundingRateFactor New funding rate factor
     */
    function setFundingRateFactor(uint256 _fundingRateFactor) external onlyOwner {
        require(_fundingRateFactor <= MAX_FUNDING_RATE_FACTOR, "Funding rate factor too high");
        fundingRateFactor = _fundingRateFactor;
    }

    /**
     * @dev Sets the margin fee basis points
     * @param _marginFeeBasisPoints New margin fee basis points
     */
    function setMarginFeeBasisPoints(uint256 _marginFeeBasisPoints) external onlyOwner {
        require(_marginFeeBasisPoints <= MAX_FEE_BASIS_POINTS, "Margin fee too high");
        marginFeeBasisPoints = _marginFeeBasisPoints;
    }

    /**
     * @dev Sets the liquidation fee in USD
     * @param _liquidationFeeUsd New liquidation fee in USD
     */
    function setLiquidationFeeUsd(uint256 _liquidationFeeUsd) external onlyOwner {
        require(_liquidationFeeUsd <= MAX_LIQUIDATION_FEE_USD, "Liquidation fee too high");
        liquidationFeeUsd = _liquidationFeeUsd;
    }

    /**
     * @dev Sets the minimum profit time
     * @param _minProfitTime New minimum profit time in seconds
     */
    function setMinProfitTime(uint256 _minProfitTime) external onlyOwner {
        minProfitTime = _minProfitTime;
    }

    /**
     * @dev Sets the price feed address
     * @param _priceFeed New price feed address
     */
    function setPriceFeed(address _priceFeed) external onlyOwner {
        require(_priceFeed != address(0), "Invalid price feed address");
        priceFeed = _priceFeed;
    }

    /**
     * @dev Sets the position manager address
     * @param _positionManager New position manager address
     */
    function setPositionManager(address _positionManager) external onlyOwner {
        require(_positionManager != address(0), "Invalid position manager address");
        positionManager = _positionManager;
    }

    /**
     * @dev Sets the collateral vault address
     * @param _collateralVault New collateral vault address
     */
    function setCollateralVault(address _collateralVault) external onlyOwner {
        require(_collateralVault != address(0), "Invalid collateral vault address");
        collateralVault = _collateralVault;
    }

    /**
     * @dev Sets the fee distributor address
     * @param _feeDistributor New fee distributor address
     */
    function setFeeDistributor(address _feeDistributor) external onlyOwner {
        require(_feeDistributor != address(0), "Invalid fee distributor address");
        feeDistributor = _feeDistributor;
    }
}
