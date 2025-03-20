// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title FeeDistributor
 * @dev Contract for collecting trading fees and distributing them
 */
contract FeeDistributor is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // AUT token address
    address public aut;
    
    // Collateral vault address
    address public collateralVault;
    
    // Accumulated fees
    uint256 public accumulatedFees;
    
    // Minimum amount for distribution
    uint256 public minDistributionAmount;
    
    // Authorized contracts that can call collectFees
    mapping(address => bool) public authorizedContracts;
    
    // Events
    event FeeCollected(address indexed from, uint256 amount);
    event FeesDistributed(uint256 amount);
    event AuthorizedContractAdded(address indexed contractAddress);
    event AuthorizedContractRemoved(address indexed contractAddress);

    /**
     * @dev Modifier to check if caller is authorized
     */
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    /**
     * @dev Constructor
     * @param _aut AUT token address
     * @param _collateralVault Collateral vault address
     * @param _minDistributionAmount Minimum amount for distribution
     */
    constructor(address _aut, address _collateralVault, uint256 _minDistributionAmount) {
        require(_aut != address(0), "Invalid AUT address");
        require(_collateralVault != address(0), "Invalid vault address");
        
        aut = _aut;
        collateralVault = _collateralVault;
        minDistributionAmount = _minDistributionAmount;
    }

    /**
     * @dev Add an authorized contract
     * @param _contract Contract address to authorize
     */
    function addAuthorizedContract(address _contract) external onlyOwner {
        require(_contract != address(0), "Invalid contract address");
        authorizedContracts[_contract] = true;
        emit AuthorizedContractAdded(_contract);
    }

    /**
     * @dev Remove an authorized contract
     * @param _contract Contract address to remove authorization
     */
    function removeAuthorizedContract(address _contract) external onlyOwner {
        authorizedContracts[_contract] = false;
        emit AuthorizedContractRemoved(_contract);
    }

    /**
     * @dev Set collateral vault address
     * @param _collateralVault New collateral vault address
     */
    function setCollateralVault(address _collateralVault) external onlyOwner {
        require(_collateralVault != address(0), "Invalid vault address");
        collateralVault = _collateralVault;
    }

    /**
     * @dev Set minimum distribution amount
     * @param _minDistributionAmount New minimum distribution amount
     */
    function setMinDistributionAmount(uint256 _minDistributionAmount) external onlyOwner {
        minDistributionAmount = _minDistributionAmount;
    }

    /**
     * @dev Collect fees from trading
     * @param _amount Amount of fees to collect
     */
    function collectFees(uint256 _amount) external nonReentrant onlyAuthorized {
        require(_amount > 0, "Amount must be > 0");
        
        // Update accumulated fees
        accumulatedFees = accumulatedFees.add(_amount);
        
        emit FeeCollected(msg.sender, _amount);
        
        // Distribute fees if accumulated amount is greater than minimum
        if (accumulatedFees >= minDistributionAmount) {
            distributeFees();
        }
    }

    /**
     * @dev Distribute accumulated fees
     */
    function distributeFees() public nonReentrant {
        require(accumulatedFees >= minDistributionAmount, "Insufficient accumulated fees");
        
        uint256 amountToDistribute = accumulatedFees;
        accumulatedFees = 0;
        
        // Call vault to distribute fees
        // First approve the vault to spend tokens
        IERC20(aut).safeApprove(collateralVault, amountToDistribute);
        
        // Call distributeFees on the vault
        (bool success, ) = collateralVault.call(
            abi.encodeWithSignature("distributeFees(uint256)", amountToDistribute)
        );
        require(success, "Fee distribution failed");
        
        emit FeesDistributed(amountToDistribute);
    }

    /**
     * @dev Force distribute fees even if below minimum (only owner)
     */
    function forceDistributeFees() external onlyOwner {
        require(accumulatedFees > 0, "No fees to distribute");
        
        uint256 amountToDistribute = accumulatedFees;
        accumulatedFees = 0;
        
        // Call vault to distribute fees
        // First approve the vault to spend tokens
        IERC20(aut).safeApprove(collateralVault, amountToDistribute);
        
        // Call distributeFees on the vault
        (bool success, ) = collateralVault.call(
            abi.encodeWithSignature("distributeFees(uint256)", amountToDistribute)
        );
        require(success, "Fee distribution failed");
        
        emit FeesDistributed(amountToDistribute);
    }

    /**
     * @dev Get accumulated fees
     * @return Accumulated fees in AUT tokens
     */
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    /**
     * @dev Emergency withdraw tokens (only owner)
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be > 0");
        
        if (_token == aut) {
            // If withdrawing AUT, reduce accumulated fees
            if (_amount >= accumulatedFees) {
                accumulatedFees = 0;
            } else {
                accumulatedFees = accumulatedFees.sub(_amount);
            }
        }
        
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
