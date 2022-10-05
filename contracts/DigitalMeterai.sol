// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.9;

contract DigitalMeterai is ERC721, Ownable {
    // Events list
    event DMT___Minted(address _seller, uint256 _price);
    event DMT___Bought(address _seller, address _buyer, uint256 _price);
    event DMT___Bound(address _owner, string document);

    // Type declarations
    enum Status {
        Available,
        Paid,
        Bound
    }

    // Global variables
    uint256 private id = 0;
    string public constant TOKEN_NAME = "Digital Meterai";
    string public constant TOKEN_SYMBOL = "DMT";
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";


    // Each NFT data mapping
    mapping (uint256 => uint256) public tokenIdToPrice; // Pricing
    mapping (uint256 => Status) public tokenIdToStatus; // Status
    mapping (uint256 => string) public tokenIdToDocument; // File Binding

    // Constructor
    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {
        //
    }

    // Helper functions
    function getTokensTotal() public view returns(uint256){
        return id;
    }

    function tokenURI(uint256) public view virtual override returns (string memory) {
        return TOKEN_URI;
    }

    
    // MAIN EXTERNAL FUNCTIONS
    function mint(uint256 price) external onlyOwner {
        // Mint new token
        _safeMint(msg.sender, id);

        // Set initial data
        tokenIdToPrice[id] = price;
        tokenIdToStatus[id] = Status.Available;
        tokenIdToDocument[id] = "";
        id++;

        // Emit event
        emit DMT___Minted(msg.sender, price);
    }

    function buy(uint256 _tokenId) external payable {
        // Only if never Paid yet
        Status status = tokenIdToStatus[_tokenId];
        require(status == Status.Available, "NFT is not available");

        // Only if price is correct
        uint256 price = tokenIdToPrice[_tokenId];
        require(msg.value == price, 'Incorrect value');
        
        // Transaction transfer
        address seller = ownerOf(_tokenId);
        _transfer(seller, msg.sender, _tokenId);
        payable(seller).transfer(msg.value);

        // Update status
        tokenIdToStatus[_tokenId] = Status.Paid;

        // Emit event
        emit DMT___Bought(seller, msg.sender, msg.value);
    }

    function bind(uint256 _tokenId, string memory _document) external {
        // Only owner can bind
        address owner = ownerOf(_tokenId);
        require(owner == msg.sender, "Only owner can bind");

        // Only if status is Paid
        Status status = tokenIdToStatus[_tokenId];
        require(status == Status.Paid, "NFT is not paid yet");

        // Update binding
        tokenIdToDocument[_tokenId] = _document;

        // Update status
        tokenIdToStatus[_tokenId] = Status.Bound;

        // Emit event
        emit DMT___Bound(msg.sender, _document);
    }


}