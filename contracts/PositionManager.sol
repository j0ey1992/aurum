// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PositionManager
 * @dev Contract for tracking user positions, calculating PnL, liquidation prices, and margin requirements
 */
contract PositionManager is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Constants
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant PRICE_PRECISION = 10 ** 30;
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% of margin consumed

    // Position structure
    struct Position {
        address trader;
        bool isLong;
        uint256 size;
        uint256 collateral;
        uint256 entryPrice;
        uint256 entryFundingRate;
        uint256 leverage;
        uint256 liquidationPrice;
        uint256 timestamp;
        bool isOpen;
    }

    // Main trading contract address
    address public autPerpetualTrading;

    // Position tracking
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositions;
    uint256 public nextPositionId = 1;

    // Events
    event PositionCreated(
        uint256 indexed positionId,
        address indexed trader,
        bool isLong,
        uint256 size,
        uint256 collateral,
        uint256 entryPrice,
        uint256 leverage,
        uint256 liquidationPrice
    );
    event PositionUpdated(
        uint256 indexed positionId,
        uint256 size,
        uint256 collateral,
        uint256 entryPrice,
        uint256 leverage,
        uint256 liquidationPrice
    );
    event PositionClosed(
        uint256 indexed positionId,
        address indexed trader,
        uint256 exitPrice,
        int256 pnl
    );
    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed trader,
        uint256 liquidationPrice
    );

    /**
     * @dev Modifier to check if caller is the AUT perpetual trading contract
     */
    modifier onlyAUTPerpetualTrading() {
        require(msg.sender == autPerpetualTrading, "Only AUT perpetual trading contract");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() {
        // Initialize with position ID 1
        nextPositionId = 1;
    }

    /**
     * @dev Set AUT perpetual trading contract address
     * @param _autPerpetualTrading AUT perpetual trading contract address
     */
    function setAUTPerpetualTrading(address _autPerpetualTrading) external onlyOwner {
        require(_autPerpetualTrading != address(0), "Invalid AUT perpetual trading address");
        autPerpetualTrading = _autPerpetualTrading;
    }

    /**
     * @dev Create a new position
     * @param _trader Trader address
     * @param _isLong Whether the position is long (true) or short (false)
     * @param _size Position size in USD
     * @param _collateral Collateral amount in USD
     * @param _entryPrice Entry price
     * @param _entryFundingRate Entry funding rate
     * @return positionId ID of the newly created position
     */
    function createPosition(
        address _trader,
        bool _isLong,
        uint256 _size,
        uint256 _collateral,
        uint256 _entryPrice,
        uint256 _entryFundingRate
    ) external onlyAUTPerpetualTrading returns (uint256) {
        require(_trader != address(0), "Invalid trader address");
        require(_size > 0, "Size must be > 0");
        require(_collateral > 0, "Collateral must be > 0");
        require(_entryPrice > 0, "Entry price must be > 0");
        
        // Calculate leverage
        uint256 leverage = _size.mul(BASIS_POINTS_DIVISOR).div(_collateral);
        
        // Calculate liquidation price
        uint256 liquidationPrice = calculateLiquidationPrice(
            _isLong,
            _entryPrice,
            leverage
        );
        
        // Create position
        uint256 positionId = nextPositionId;
        positions[positionId] = Position({
            trader: _trader,
            isLong: _isLong,
            size: _size,
            collateral: _collateral,
            entryPrice: _entryPrice,
            entryFundingRate: _entryFundingRate,
            leverage: leverage,
            liquidationPrice: liquidationPrice,
            timestamp: block.timestamp,
            isOpen: true
        });
        
        // Add position to user's positions
        userPositions[_trader].push(positionId);
        
        // Increment position ID
        nextPositionId = nextPositionId.add(1);
        
        emit PositionCreated(
            positionId,
            _trader,
            _isLong,
            _size,
            _collateral,
            _entryPrice,
            leverage,
            liquidationPrice
        );
        
        return positionId;
    }

    /**
     * @dev Update an existing position
     * @param _positionId Position ID
     * @param _sizeDelta Change in position size (can be positive or negative)
     * @param _collateralDelta Change in collateral (can be positive or negative)
     * @param _entryPrice New entry price (if size is increased)
     * @param _entryFundingRate New entry funding rate
     */
    function updatePosition(
        uint256 _positionId,
        int256 _sizeDelta,
        int256 _collateralDelta,
        uint256 _entryPrice,
        uint256 _entryFundingRate
    ) external onlyAUTPerpetualTrading {
        Position storage position = positions[_positionId];
        require(position.isOpen, "Position not open");
        
        // Update size
        if (_sizeDelta > 0) {
            position.size = position.size.add(uint256(_sizeDelta));
        } else if (_sizeDelta < 0) {
            require(position.size >= uint256(-_sizeDelta), "Size delta too large");
            position.size = position.size.sub(uint256(-_sizeDelta));
        }
        
        // Update collateral
        if (_collateralDelta > 0) {
            position.collateral = position.collateral.add(uint256(_collateralDelta));
        } else if (_collateralDelta < 0) {
            require(position.collateral >= uint256(-_collateralDelta), "Collateral delta too large");
            position.collateral = position.collateral.sub(uint256(-_collateralDelta));
        }
        
        // Update entry price if size is increased
        if (_sizeDelta > 0) {
            // Calculate weighted average entry price
            uint256 existingSize = position.size.sub(uint256(_sizeDelta));
            position.entryPrice = (
                position.entryPrice.mul(existingSize).add(_entryPrice.mul(uint256(_sizeDelta)))
            ).div(position.size);
        }
        
        // Update entry funding rate
        position.entryFundingRate = _entryFundingRate;
        
        // Recalculate leverage
        position.leverage = position.size.mul(BASIS_POINTS_DIVISOR).div(position.collateral);
        
        // Recalculate liquidation price
        position.liquidationPrice = calculateLiquidationPrice(
            position.isLong,
            position.entryPrice,
            position.leverage
        );
        
        emit PositionUpdated(
            _positionId,
            position.size,
            position.collateral,
            position.entryPrice,
            position.leverage,
            position.liquidationPrice
        );
    }

    /**
     * @dev Close a position
     * @param _positionId Position ID
     * @param _exitPrice Exit price
     * @param _pnl Profit or loss (negative for losses)
     */
    function closePosition(
        uint256 _positionId,
        uint256 _exitPrice,
        int256 _pnl
    ) external onlyAUTPerpetualTrading {
        Position storage position = positions[_positionId];
        require(position.isOpen, "Position not open");
        
        // Mark position as closed
        position.isOpen = false;
        
        emit PositionClosed(
            _positionId,
            position.trader,
            _exitPrice,
            _pnl
        );
    }

    /**
     * @dev Liquidate a position
     * @param _positionId Position ID
     */
    function liquidatePosition(
        uint256 _positionId
    ) external onlyAUTPerpetualTrading {
        Position storage position = positions[_positionId];
        require(position.isOpen, "Position not open");
        
        // Mark position as closed
        position.isOpen = false;
        
        emit PositionLiquidated(
            _positionId,
            position.trader,
            position.liquidationPrice
        );
    }

    /**
     * @dev Calculate liquidation price
     * @param _isLong Whether the position is long (true) or short (false)
     * @param _entryPrice Entry price
     * @param _leverage Leverage
     * @return liquidationPrice Liquidation price
     */
    function calculateLiquidationPrice(
        bool _isLong,
        uint256 _entryPrice,
        uint256 _leverage
    ) public pure returns (uint256) {
        // Maintenance margin is 20% (LIQUIDATION_THRESHOLD = 80%)
        uint256 maintenanceMargin = BASIS_POINTS_DIVISOR.sub(LIQUIDATION_THRESHOLD).mul(BASIS_POINTS_DIVISOR).div(_leverage);
        
        if (_isLong) {
            // For longs: liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMargin)
            return _entryPrice.mul(
                BASIS_POINTS_DIVISOR.sub(BASIS_POINTS_DIVISOR.div(_leverage).add(maintenanceMargin))
            ).div(BASIS_POINTS_DIVISOR);
        } else {
            // For shorts: liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMargin)
            return _entryPrice.mul(
                BASIS_POINTS_DIVISOR.add(BASIS_POINTS_DIVISOR.div(_leverage).sub(maintenanceMargin))
            ).div(BASIS_POINTS_DIVISOR);
        }
    }

    /**
     * @dev Calculate PnL for a position
     * @param _positionId Position ID
     * @param _currentPrice Current price
     * @return pnl Profit or loss (negative for losses)
     */
    function calculatePnL(
        uint256 _positionId,
        uint256 _currentPrice
    ) external view returns (int256) {
        Position storage position = positions[_positionId];
        require(position.isOpen, "Position not open");
        
        if (position.isLong) {
            // For longs: (currentPrice - entryPrice) / entryPrice * size
            if (_currentPrice > position.entryPrice) {
                // Profit
                return int256(
                    _currentPrice.sub(position.entryPrice).mul(position.size).div(position.entryPrice)
                );
            } else {
                // Loss
                return -int256(
                    position.entryPrice.sub(_currentPrice).mul(position.size).div(position.entryPrice)
                );
            }
        } else {
            // For shorts: (entryPrice - currentPrice) / entryPrice * size
            if (position.entryPrice > _currentPrice) {
                // Profit
                return int256(
                    position.entryPrice.sub(_currentPrice).mul(position.size).div(position.entryPrice)
                );
            } else {
                // Loss
                return -int256(
                    _currentPrice.sub(position.entryPrice).mul(position.size).div(position.entryPrice)
                );
            }
        }
    }

    /**
     * @dev Check if a position should be liquidated
     * @param _positionId Position ID
     * @param _currentPrice Current price
     * @return shouldLiquidate Whether the position should be liquidated
     */
    function shouldLiquidate(
        uint256 _positionId,
        uint256 _currentPrice
    ) external view returns (bool) {
        Position storage position = positions[_positionId];
        if (!position.isOpen) {
            return false;
        }
        
        if (position.isLong) {
            return _currentPrice <= position.liquidationPrice;
        } else {
            return _currentPrice >= position.liquidationPrice;
        }
    }

    /**
     * @dev Get all positions for a trader
     * @param _trader Trader address
     * @return positionIds Array of position IDs
     */
    function getPositionsForTrader(
        address _trader
    ) external view returns (uint256[] memory) {
        return userPositions[_trader];
    }

    /**
     * @dev Get open positions for a trader
     * @param _trader Trader address
     * @return openPositionIds Array of open position IDs
     */
    function getOpenPositionsForTrader(
        address _trader
    ) external view returns (uint256[] memory) {
        uint256[] memory traderPositions = userPositions[_trader];
        uint256 openCount = 0;
        
        // Count open positions
        for (uint256 i = 0; i < traderPositions.length; i++) {
            if (positions[traderPositions[i]].isOpen) {
                openCount++;
            }
        }
        
        // Create array of open positions
        uint256[] memory openPositions = new uint256[](openCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < traderPositions.length; i++) {
            if (positions[traderPositions[i]].isOpen) {
                openPositions[index] = traderPositions[i];
                index++;
            }
        }
        
        return openPositions;
    }

    /**
     * @dev Get position details
     * @param _positionId Position ID
     * @return trader Trader address
     * @return isLong Whether the position is long
     * @return size Position size
     * @return collateral Collateral amount
     * @return entryPrice Entry price
     * @return leverage Leverage
     * @return liquidationPrice Liquidation price
     * @return timestamp Position creation timestamp
     * @return isOpen Whether the position is open
     */
    function getPosition(
        uint256 _positionId
    ) external view returns (
        address trader,
        bool isLong,
        uint256 size,
        uint256 collateral,
        uint256 entryPrice,
        uint256 leverage,
        uint256 liquidationPrice,
        uint256 timestamp,
        bool isOpen
    ) {
        Position storage position = positions[_positionId];
        return (
            position.trader,
            position.isLong,
            position.size,
            position.collateral,
            position.entryPrice,
            position.leverage,
            position.liquidationPrice,
            position.timestamp,
            position.isOpen
        );
    }

    /**
     * @dev Validate margin requirements for a position
     * @param _size Position size
     * @param _collateral Collateral amount
     * @param _leverage Leverage
     * @return isValid Whether margin requirements are met
     */
    function validateMargin(
        uint256 _size,
        uint256 _collateral,
        uint256 _leverage
    ) external pure returns (bool) {
        // Check if size = collateral * leverage
        return _size == _collateral.mul(_leverage).div(BASIS_POINTS_DIVISOR);
    }
}
