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

    mapping(address => bool) private verifiers;
    mapping(address => address) private projectReceivers;

    function initialize(address owner_) public initializer {
        transferOwnership(owner_);
        verifiers[owner_] = true;
    }

    function setVerifier(address verifier_) external override onlyOwner {
        verifiers[verifier_] = true;
    }

    function revokeVerifier(address verifier_) external override onlyOwner {
        verifiers[verifier_] = false;
    }

    function setProjectReceiver(address project_, address receiver_) external override onlyOwner {
        projectReceivers[project_] = receiver_;
    }

    function projectReceiver(address project_) public view override returns (address) {
        if(projectReceivers[project_] == address(0)) {
            return owner();
        }

        return projectReceivers[project_];
    }

    function hash(Order memory order) public view override returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                msg.sender,
                INFTUpgradeable(order.project).balanceOf(order.to),
                order.token,
                order.amount,
                order.fee,
                order.project,
                order.to,
                order.uri,
                order.package
            )
        );
    }

    function recoverVerifier(Order memory order, bytes memory sig) public view override returns (address) {
        return hash(order).toEthSignedMessageHash().recover(sig);
    }

    function _transferToken(address token, address from, address to, uint256 amount) internal {
        require(0 < amount);
        
        IERC20(token).safeTransferFrom(from, to, amount);
    }

    function mint(Order memory order, bytes memory sig) public payable override {
        address _verifier = recoverVerifier(order, sig);
        require(verifiers[_verifier], "403");
        
        address payable _projectReceiver = payable(projectReceiver(order.project));
        uint256 transferAmount = order.amount - order.fee;
        if (address(0) == order.token) {
            require(order.amount <= msg.value, "400");
            Address.sendValue(_projectReceiver, transferAmount);
        }   else {
            _transferToken(order.token, msg.sender, _projectReceiver, transferAmount);
            if (0 < msg.value) {
                Address.sendValue(_projectReceiver, msg.value);
            }
        }
        
        INFTPackage(order.project).safeMintTo(order.to, order.package, order.uri);
    }
}
