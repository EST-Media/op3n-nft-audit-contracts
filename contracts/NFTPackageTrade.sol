//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./INFTPackage.sol";
import "./INFTPackageTrade.sol";

library SafeNFTPackage {
    using Address for address;

    function safeMintTo(
        INFTPackage token,
        address to,
        string memory pkg,
        string memory uri
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.mintTo.selector, to, pkg, uri));
    }

    function _callOptionalReturn(INFTPackage token, bytes memory data) private {
        address(token).functionCall(data);
    }
}

contract NFTPackageTrade is Ownable, Initializable, INFTPackageTrade {
    using ECDSA for bytes32;
    using ERC165Checker for address;
    using SafeERC20 for IERC20;
    using SafeNFTPackage for INFTPackage;

    mapping(bytes32 => bool) public finalized;
    address payable private _feeRecipient;
    mapping(address => bool) private _verifiers;
    mapping(address => address) private _projectRecipients;

    function initialize(address owner_) public initializer {
        transferOwnership(owner_);
        _verifiers[owner_] = true;
        _feeRecipient = payable(owner_);
    }

    function setVerifier(address verifier_) external override onlyOwner {
        _verifiers[verifier_] = true;
    }

    function revokeVerifier(address verifier_) external override onlyOwner {
        _verifiers[verifier_] = false;
    }
    
    function setFeeRecipient(address feeRecipient_) external override onlyOwner {
        _feeRecipient = payable(feeRecipient_);
    }

    function setProjectRecipient(address project_, address recipient_) external override onlyOwner {
        _projectRecipients[project_] = recipient_;
    }

    function projectRecipient(address project_) public view override returns (address) {
        if(_projectRecipients[project_] == address(0)) {
            return owner();
        }

        return _projectRecipients[project_];
    }

    function hashOrder(Order memory order) public view override returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                msg.sender,
                order.salt,
                order.token,
                order.amount,
                order.fee,
                order.project,
                order.to,
                order.package,
                order.uri
            )
        );
    }

    function hashOrderToSign(Order memory order) public view override returns (bytes32) {
        return hashOrder(order).toEthSignedMessageHash();
    }

    function _transferToken(address token, address from, address to, uint256 amount) internal {
        require(0 < amount);
        
        IERC20(token).safeTransferFrom(from, to, amount);
    }

    function mint(Order memory order, bytes memory sig) public payable override {
        require(order.fee < order.amount, "400");
        require(address(0) != order.token || order.amount <= msg.value, "400");

        bytes32 _hashOrder = hashOrderToSign(order);
        require(_verifiers[_hashOrder.recover(sig)], "401");
    
        require(!finalized[_hashOrder], "403");
        finalized[_hashOrder] = true;

        address payable _projectRecipient = payable(projectRecipient(order.project));
        uint256 transferAmount = order.amount - order.fee;
        if (address(0) == order.token) {
            Address.sendValue(_projectRecipient, transferAmount);
            if (0 < order.fee) {
                Address.sendValue(_feeRecipient, order.fee);
            }
        }   else {
            _transferToken(order.token, msg.sender, _projectRecipient, transferAmount);
            if (0 < order.fee) {
                _transferToken(order.token, msg.sender, _feeRecipient, order.fee);
            }
            if (0 < msg.value) {
                Address.sendValue(_projectRecipient, msg.value);
            }
        }
        
        INFTPackage(order.project).safeMintTo(order.to, order.package, order.uri);
    }
}
