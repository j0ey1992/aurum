// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CollateralVault
 * @dev Contract for securely storing user collateral (AUT tokens)
 */
contract CollateralVault is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // AUT token address
    address public aut;
    
    // Insurance fund percentage (40% of fees)
    uint256 public constant INSURANCE_FUND_PERCENT = 40;
    
    // Burn percentage (40% of fees)
    uint256 public constant BURN_PERCENT = 40;
    
    // Protocol revenue percentage (20% of fees)
    uint256 public constant PROTOCOL_REVENUE_PERCENT = 20;
    
    // Burn address
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Protocol revenue address
    address public protocolRevenueAddress;
    
    // Insurance fund balance
    uint256 public insuranceFundBalance;
    
    // Authorized contracts that can call transferToken
    mapping(address => bool) public authorizedContracts;
    
    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event FeeDistributed(uint256 burnAmount, uint256 insuranceAmount, uint256 revenueAmount);
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
     * @param _protocolRevenueAddress Address to receive protocol revenue
     */
    constructor(address _aut, address _protocolRevenueAddress) {
        require(_aut != address(0), "Invalid AUT address");
        require(_protocolRevenueAddress != address(0), "Invalid protocol revenue address");
        
        aut = _aut;
        protocolRevenueAddress = _protocolRevenueAddress;
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
     * @dev Set protocol revenue address
     * @param _protocolRevenueAddress New protocol revenue address
     */
    function setProtocolRevenueAddress(address _protocolRevenueAddress) external onlyOwner {
        require(_protocolRevenueAddress != address(0), "Invalid protocol revenue address");
        protocolRevenueAddress = _protocolRevenueAddress;
    }

    /**
     * @dev Deposit AUT tokens into the vault
     * @param _amount Amount of AUT tokens to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        
        // Transfer AUT tokens from user to vault
        IERC20(aut).safeTransferFrom(msg.sender, address(this), _amount);
        
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @dev Transfer tokens from vault to a user (only callable by authorized contracts)
     * @param _token Token address
     * @param _to Recipient address
     * @param _amount Amount to transfer
     */
    function transferToken(address _token, address _to, uint256 _amount) external nonReentrant onlyAuthorized {
        require(_token == aut, "Only AUT token allowed");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        
        // Transfer tokens
        IERC20(_token).safeTransfer(_to, _amount);
        
        emit Withdrawal(_to, _amount);
    }

    /**
     * @dev Distribute fees (called by FeeDistributor)
     * @param _amount Amount of fees to distribute
     */
    function distributeFees(uint256 _amount) external nonReentrant onlyAuthorized {
        require(_amount > 0, "Amount must be > 0");
        
        // Calculate fee distribution
        uint256 burnAmount = _amount.mul(BURN_PERCENT).div(100);
        uint256 insuranceAmount = _amount.mul(INSURANCE_FUND_PERCENT).div(100);
        uint256 revenueAmount = _amount.mul(PROTOCOL_REVENUE_PERCENT).div(100);
        
        // Update insurance fund balance
        insuranceFundBalance = insuranceFundBalance.add(insuranceAmount);
        
        // Transfer burn amount to burn address
        IERC20(aut).safeTransfer(BURN_ADDRESS, burnAmount);
        
        // Transfer protocol revenue
        IERC20(aut).safeTransfer(protocolRevenueAddress, revenueAmount);
        
        emit FeeDistributed(burnAmount, insuranceAmount, revenueAmount);
    }

    /**
     * @dev Use insurance fund to cover losses (only callable by authorized contracts)
     * @param _amount Amount to use from insurance fund
     * @param _recipient Recipient address
     * @return success Whether the operation was successful
     */
    function useInsuranceFund(uint256 _amount, address _recipient) external nonReentrant onlyAuthorized returns (bool) {
        require(_amount > 0, "Amount must be > 0");
        require(_recipient != address(0), "Invalid recipient");
        
        // Check if insurance fund has enough balance
        if (_amount > insuranceFundBalance) {
            return false;
        }
        
        // Update insurance fund balance
        insuranceFundBalance = insuranceFundBalance.sub(_amount);
        
        // Transfer tokens
        IERC20(aut).safeTransfer(_recipient, _amount);
        
        return true;
    }

    /**
     * @dev Get the total balance of the vault
     * @return Total balance in AUT tokens
     */
    function getTotalBalance() external view returns (uint256) {
        return IERC20(aut).balanceOf(address(this));
    }

    /**
     * @dev Get the available balance (total balance - insurance fund)
     * @return Available balance in AUT tokens
     */
    function getAvailableBalance() external view returns (uint256) {
        uint256 totalBalance = IERC20(aut).balanceOf(address(this));
        return totalBalance > insuranceFundBalance ? totalBalance.sub(insuranceFundBalance) : 0;
    }

    /**
     * @dev Get the insurance fund balance
     * @return Insurance fund balance in AUT tokens
     */
    function getInsuranceFundBalance() external view returns (uint256) {
        return insuranceFundBalance;
    }

    /**
     * @dev Emergency withdraw tokens (only owner)
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be > 0");
        
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
