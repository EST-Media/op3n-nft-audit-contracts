// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

interface INFTPackageTrade {
    struct Order {
        uint256 salt;
        address token;
        uint256 amount;
        uint256 fee;
        address project;
        address to;
        string package;
        string uri;
    }

    function setVerifier(address verifier_) external;
    function revokeVerifier(address verifier_) external;
    function setFeeRecipient(address feeRecipient_) external;
    function setProjectRecipient(address project_, address recipient_) external;
    function projectRecipient(address project_) external view returns (address);
    function hashOrder(Order memory order) external view returns (bytes32);
    function hashOrderToSign(Order memory order) external view returns (bytes32);
    function mint(Order memory order, bytes memory sig) external payable;
}