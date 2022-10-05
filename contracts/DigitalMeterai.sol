// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.9;

contract DigitalMeterai is ERC721, Ownable {
    // EVENTS
    event DMT___Minted(address _seller, uint256 quantity, uint256 _price);
    event DMT___Bought(address _seller, address _buyer, uint256 _price);
    event DMT___Bound(address _owner, string document);

    // TYPE DECLARATIONS
    enum Status {
        Available,
        Paid,
        Bound
    }

    // GLOBAL VARIABLES
    uint256 private id = 0;
    string private constant TOKEN_NAME = "Digital Meterai";
    string private constant TOKEN_SYMBOL = "DMT";
    string private constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    // DATABASE
    mapping (uint256 => uint256) private tokenIdToPrice; // Pricing
    mapping (uint256 => Status) private tokenIdToStatus; // Status
    mapping (uint256 => string) private tokenIdToDocument; // File binding

    // CONSTRUCTOR
    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    // READ FUNCTIONS
    /* get the image of d-Meterai */
    function tokenURI(uint256) public view virtual override returns (string memory) {
        return TOKEN_URI;
    }

    /* get current status of a d-meterai: Available, Paid, Bound */
    function getTokenStatus(uint256 _tokenId) public view returns(Status){
        return tokenIdToStatus[_tokenId];        
    }

    /* get the price of a d-meterai */
    function getTokenPrice(uint256 _tokenId) public view returns(uint256){
        return tokenIdToPrice[_tokenId];        
    }

    /* get the document bound to a d-meterai */
    function getTokenDocument(uint256 _tokenId) public view returns(string memory){
        return tokenIdToDocument[_tokenId];        
    }
    
    /* get the amount of all circulating tokens */
    function getTokensTotal() public view returns(uint256){
        return id;
    }

    // ACTION FUNCTIONS
    /* mint a new d-meterai only by Contract Owner: Government */
    function mint(uint256 quantity, uint256 price) external onlyOwner {
        for (uint256 i = 0; i < quantity; i++) {
            // Mint new token
            _safeMint(msg.sender, id);

            // Set initial data
            tokenIdToPrice[id] = price;
            tokenIdToStatus[id] = Status.Available;
            tokenIdToDocument[id] = "";
            id++;

        }
        // Emit event
        emit DMT___Minted(msg.sender, quantity, price);
    }

    /* buy a d-meterai, only can be transacted once from government to a person */
    function buy(uint256 _tokenId) external payable {
        // Only if never Paid yet
        Status status = tokenIdToStatus[_tokenId];
        require(status == Status.Available, "NFT is already paid or bound");

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

    /* bind a document to a d-meterai only by owner */
    function bind(uint256 _tokenId, string memory _document) external {
        // Only if status is Paid
        Status status = tokenIdToStatus[_tokenId];
        require(status == Status.Paid, "NFT is not paid yet");

        // Only owner can bind
        address owner = ownerOf(_tokenId);
        require(owner == msg.sender, "Only owner can bind");

        // Update binding
        tokenIdToDocument[_tokenId] = _document;

        // Update status
        tokenIdToStatus[_tokenId] = Status.Bound;

        // Emit event
        emit DMT___Bound(msg.sender, _document);
    }
}