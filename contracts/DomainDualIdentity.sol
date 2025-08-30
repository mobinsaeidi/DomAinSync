// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract DomainDualIdentity is ERC721, Ownable {
    mapping(string => bytes32) private whoisHashes;
    mapping(uint256 => string) private tokenToDomain;
    uint256 private _nextTokenId;

    constructor() ERC721("DomainDualIdentity", "DDI") Ownable(msg.sender) {}
    function registerDomain(
        string calldata domainName,
        bytes32 whoisHash
    ) external {
        uint256 tokenId = _nextTokenId;
        _safeMint(msg.sender, tokenId);
        whoisHashes[domainName] = whoisHash;
        tokenToDomain[tokenId] = domainName;
        _nextTokenId++;
    }
    function getWhoisHash(
        string calldata domainName
    ) external view returns (bytes32) {
        return whoisHashes[domainName];
    }
    function updateWhoisHash(
        uint256 tokenId,
        bytes32 newWhoisHash
    ) external {
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(owner, msg.sender),
            "Not owner or approved"
        );

        require(_existsCustom(tokenId), "Token does not exist");

        string memory domain = tokenToDomain[tokenId];
        whoisHashes[domain] = newWhoisHash;
    }

    function getDomainByTokenId(
        uint256 tokenId
    ) external view returns (string memory) {
        require(_existsCustom(tokenId), "Token does not exist");
        return tokenToDomain[tokenId];
    }

    function _existsCustom(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
