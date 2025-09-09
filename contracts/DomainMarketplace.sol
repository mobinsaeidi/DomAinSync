// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DomainMarketplace is Ownable {
    IERC721 public domainContract;

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;

    event DomainListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event DomainSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);

    constructor(address _domainContract) Ownable(msg.sender) {
        domainContract = IERC721(_domainContract);
    }

    function listDomain(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        require(domainContract.ownerOf(tokenId) == msg.sender, "Not domain owner");
        require(
            domainContract.getApproved(tokenId) == address(this) ||
            domainContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listings[tokenId] = Listing({ seller: msg.sender, price: price });
        emit DomainListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listed = listings[tokenId];
        require(listed.seller == msg.sender, "Not seller");
        delete listings[tokenId];
        emit ListingCancelled(tokenId);
    }

    function buyDomain(uint256 tokenId) external payable {
        Listing memory listed = listings[tokenId];
        require(listed.price > 0, "Domain not listed");
        require(msg.value >= listed.price, "Insufficient payment");

        // انتقال دامنه به خریدار
        domainContract.safeTransferFrom(listed.seller, msg.sender, tokenId);

        // پرداخت به فروشنده
        payable(listed.seller).transfer(msg.value);

        // حذف آگهی
        delete listings[tokenId];

        emit DomainSold(tokenId, msg.sender, listed.price);
    }
}
