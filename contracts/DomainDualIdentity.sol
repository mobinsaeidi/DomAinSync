// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DomainDualIdentity is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _domainNames;

    event DomainTransferred(uint256 indexed tokenId, address indexed from, address indexed to, string domainName);

    constructor() ERC721("DomainDualIdentity", "DDI") Ownable(msg.sender) {}

    function mintDomain(address to, string memory domainName) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _domainNames[tokenId] = domainName;
    }

    function transferDomain(address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner or approved");
        string memory domainName = _domainNames[tokenId];
        address from = ownerOf(tokenId);
        _transfer(from, to, tokenId);
        emit DomainTransferred(tokenId, from, to, domainName);
    }

    function getDomainName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _domainNames[tokenId];
    }
}
