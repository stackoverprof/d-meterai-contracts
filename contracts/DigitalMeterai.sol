// SPDX-License-Identifier: MIT

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

pragma solidity ^0.8.9;


contract DigitalMeterai is ERC721, Ownable {
    // EVENTS
    event DMT___Minted(address _seller, uint256 quantity, uint256 _price);
    event DMT___Bought(address _seller, address _buyer, uint256 _price);
    event DMT___Bound(address _owner, string document);

    // ERRORS
    error DMT___UnmatchedStatusNotAvailable();
    error DMT___UnmatchedStatusNotPaid();
    error DMT___InvalidTransactionIncorrectValue();
    error DMT___ForbiddenActionsNotOwner();

    // TYPE DECLARATIONS
    enum Status {
        Available,
        Paid,
        Bound
    }

    // GLOBAL VARIABLES
    uint256 private id = 0;
    string private constant TOKEN_NAME = 'Digital Meterai';
    string private constant TOKEN_SYMBOL = 'DMT';
    string private constant TOKEN_URI =
        'ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json';

    // DATABASE
    mapping (uint256 => uint256) private tokenIdToPrice; // Pricing
    mapping (uint256 => Status) private tokenIdToStatus; // Status
    mapping (uint256 => string) private tokenIdToDocument; // File binding

    // CONSTRUCTOR
    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    // READ FUNCTIONS
    /* Get the image of d-Meterai */
    function tokenURI(uint256) public view virtual override returns (string memory) {
        return TOKEN_URI;
    }

    /* Get current status of a d-meterai: Available, Paid, Bound */
    function getTokenStatus(uint256 _tokenId) public view returns(Status){
        return tokenIdToStatus[_tokenId];        
    }

    /* Get the price of a d-meterai */
    function getTokenPrice(uint256 _tokenId) public view returns(uint256){
        return tokenIdToPrice[_tokenId];        
    }

    /* Get the document bound to a d-meterai */
    function getTokenDocument(uint256 _tokenId) public view returns(string memory){
        return tokenIdToDocument[_tokenId];        
    }
    
    /* Get the amount of all circulating tokens */
    function getTokensTotal() public view returns(uint256){
        return id;
    }

    // ACTION FUNCTIONS
    /* Mint a new d-meterai only by contract owner */
    function mint(uint256 quantity, uint256 price) external onlyOwner {
        for (uint256 i = 0; i < quantity; i++) {
            // Mint new token
            _safeMint(msg.sender, id);

            // Set initial data
            tokenIdToPrice[id] = price;
            tokenIdToStatus[id] = Status.Available;
            tokenIdToDocument[id] = '';
            id++;

        }
        // Emit event
        emit DMT___Minted(msg.sender, quantity, price);
    }

    /* Ownership change, only can be transactioned once from minter to a first buyer */
    function buy(uint256 _tokenId) external payable {
        // Only if never Paid yet
        Status status = tokenIdToStatus[_tokenId];
        if (status != Status.Available) revert DMT___UnmatchedStatusNotAvailable();

        // Only if price is correct
        uint256 price = tokenIdToPrice[_tokenId];
        if (msg.value != price) revert DMT___InvalidTransactionIncorrectValue();
        
        // Transaction transfer
        address seller = ownerOf(_tokenId);
        _transfer(seller, msg.sender, _tokenId);
        payable(seller).transfer(msg.value);

        // Update status
        tokenIdToStatus[_tokenId] = Status.Paid;

        // Emit event
        emit DMT___Bought(seller, msg.sender, msg.value);
    }

    /* Bind a document to a d-meterai only by owner */
    function bind(uint256 _tokenId, string memory _document) external {
        // Only if status is Paid
        Status status = tokenIdToStatus[_tokenId];
        if (status != Status.Paid) revert DMT___UnmatchedStatusNotPaid();

        // Only owner can bind
        address owner = ownerOf(_tokenId);
        if (owner != msg.sender) revert DMT___ForbiddenActionsNotOwner();

        // Update binding
        tokenIdToDocument[_tokenId] = _document;

        // Update status
        tokenIdToStatus[_tokenId] = Status.Bound;

        // Emit event
        emit DMT___Bound(msg.sender, _document);
    }
}