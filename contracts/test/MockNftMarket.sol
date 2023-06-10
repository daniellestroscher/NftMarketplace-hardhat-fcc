// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "../NftMarketplace.sol";
import "./BasicNft.sol";

contract MockNftMarket {
    NftMarketplace public nftMarket;
    BasicNft public basicNft;
    address marketAddress;

    constructor(address _nftMarketplaceAddress, address _basicNftAddress) {
        nftMarket = NftMarketplace(_nftMarketplaceAddress);
        basicNft = BasicNft(_basicNftAddress);
        marketAddress = address(nftMarket);
    }

    function reApproveMarket(address nftMarketplace, uint256 tokenId) public {}

    function mockListItem(address nftAddress, uint256 tokenId, uint256 price) public {
        basicNft.approve(marketAddress, tokenId);
        nftMarket.listItem(nftAddress, tokenId, price);
    }

    /**
     * @dev this mock function will call the original contract function and as the reciver of proceeds,
     * fail on transfer from its reverting recive function.
     */
    function mockWithdraw() public {
        nftMarket.withdrawProceeds();
    }

    receive() external payable {
        revert("no thanks");
    }
}
