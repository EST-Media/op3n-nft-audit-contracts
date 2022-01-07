//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./INFTPackage.sol";

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

contract NFTPackageMinter is Ownable {
    using SafeNFTPackage for INFTPackage;

    mapping(address => bool) private minters;

    constructor() {
        minters[msg.sender] = true;
    }

    function setMinter(address minter_) external onlyOwner {
        minters[minter_] = true;
    }

    function setMinters(address[] memory minters_) external onlyOwner {
        for(uint i = 0; i < minters_.length; i++){
            minters[minters_[i]] = true;
        }
    }

    function revokeMinter(address minter_) external onlyOwner {
        minters[minter_] = false;
    }

    function revokeMinters(address[] memory minters_) external onlyOwner {
        for(uint i = 0; i < minters_.length; i++){
            minters[minters_[i]] = false;
        }
    }

    function isMinter(address minter_) public view returns (bool) {
        return minters[minter_];
    }

    function mint(address token, address to, string memory pkg, string memory uri) public {
        require(minters[msg.sender], "403");
        
        INFTPackage(token).safeMintTo(to, pkg, uri);
    }
}
