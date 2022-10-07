// SPDX-License-Identifier: MIT

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import 'hardhat/console.sol';

pragma solidity ^0.8.9;


contract DigitalMeterai is ERC721, Ownable {
    // EVENTS
    event DMT___Minted(uint256[] tokenIds);
    event DMT___Bought(uint256 tokenId);
    event DMT___Bound();

    // ERRORS
    error DMT___UnmatchedStatusNotAvailable();
    error DMT___UnmatchedStatusNotPaid();
    error DMT___InvalidTransactionIncorrectValue();
    error DMT___ForbiddenActionsNotOwner();
    error DMT___OutOfStock();

    // TYPE DECLARATIONS
    enum Status {
        Available,
        Paid,
        Bound
    }

    struct TokenData {
        uint256 tokenId;
        address owner;
        string document;
        Status status;
        uint256 price;
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

    /* Get owned tokens data */
    function getMyTokens() external view returns(TokenData[] memory){
        TokenData[] memory tokens = new TokenData[](balanceOf(msg.sender));
        uint256 index = 0;
        for (uint256 i = 0; i < id; i++) {
            if (ownerOf(i) == msg.sender) {
                tokens[index] = TokenData({
                    tokenId: i,
                    owner: ownerOf(i),
                    document: tokenIdToDocument[i],
                    status: tokenIdToStatus[i],
                    price: tokenIdToPrice[i]
                });
                index++;
            }
        }
        return tokens;
    }
    
    /* Get the amount of all circulating tokens */
    function getTotalSupply() external view onlyOwner returns(uint256){
        return id;
    }

    /* Get the amount of all circulating tokens by status */
    function getTotalSupplyByStatus(Status _status) external view onlyOwner returns(uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < id; i++) {
            if (tokenIdToStatus[i] == _status) {
                total++;
            }
        }
        return total;
    }

    /* Get one available token to buy */
    function getAvailableToken() external view returns(TokenData memory){
        for (uint256 i = 0; i < id; i++) {
            if (tokenIdToStatus[i] == Status.Available) {
                return TokenData({
                    tokenId: i,
                    owner: ownerOf(i),
                    document: tokenIdToDocument[i],
                    status: tokenIdToStatus[i],
                    price: tokenIdToPrice[i]
                });
            }
        }
        revert DMT___OutOfStock();
    }

    /* Get a token data by tokenId */
    function getToken(uint256 _tokenId) external onlyOwner view returns(TokenData memory){
        return TokenData({
            tokenId: _tokenId,
            owner: ownerOf(_tokenId),
            document: tokenIdToDocument[_tokenId],
            status: tokenIdToStatus[_tokenId],
            price: tokenIdToPrice[_tokenId]
        });
    }

    // ACTION FUNCTIONS
    /* Mint a new d-meterai only by contract owner */
    function mint(uint256 quantity, uint256 price) external onlyOwner {
        uint256[] memory tokenIds = new uint256[](quantity);
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
        emit DMT___Minted(tokenIds);
    }

    /* Ownership change, only can be transactioned once from minter to a first buyer */
    function buy(uint256 tokenId) external payable {

        // Only if never Paid yet
        Status status = tokenIdToStatus[tokenId];
        if (status != Status.Available) revert DMT___UnmatchedStatusNotAvailable();

        // Only if price is correct
        uint256 price = tokenIdToPrice[tokenId];
        if (msg.value != price) revert DMT___InvalidTransactionIncorrectValue();
        
        // Transaction transfer
        address seller = ownerOf(tokenId);
        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(msg.value);

        // Update status
        tokenIdToStatus[tokenId] = Status.Paid;

        // Emit event
        emit DMT___Bought(tokenId);
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
        emit DMT___Bound();
    }
}