// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

interface INFTPackageTrade {
    struct Order {
        address token;
        uint256 amount;
        uint256 fee;
        address project;
        address to;
        string uri;
        string package;
    }

    function setVerifier(address verifier_) external;
    function revokeVerifier(address verifier_) external;
    function setProjectReceiver(address project_, address receiver_) external;
    function projectReceiver(address project_) external view returns (address);
    function hash(Order memory order) external view returns (bytes32);
    function recoverVerifier(Order memory order, bytes memory sig) external view returns (address);
    function mint(Order memory order, bytes memory sig) external payable;
}