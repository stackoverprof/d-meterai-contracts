// SPDX-License-Identifier: MIT

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

pragma solidity ^0.8.9;


contract DigitalMeterai is ERC721, Ownable {
    // EVENTS
    event DMT___Minted(uint256[] tokenIds);
    event DMT___Bought(uint256 tokenId);
    event DMT___Bound(uint256 tokenId);
    event DMT___AccessControlChanged();

    // ERRORS
    error ERROR___OutOfStock();
    error ERROR___AccessDenied();
    error ERROR___InvalidStatus();
    error ERROR___InvalidPayment();
    error ERROR___ForbiddenCommand();

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

    // DATABASE
    mapping (uint256 => uint256) private DATA_Price; // Pricing
    mapping (uint256 => Status) private DATA_Status; // Status
    mapping (uint256 => string) private DATA_Document; // File binding
    mapping (uint256 => address[]) private DATA_AccessControl; // Access control
    mapping (uint256 => string) private DATA_Password; // Password for document

    // CONSTRUCTOR
    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    // READ FUNCTIONS
    /* Get owned tokens data */
    function getMyTokens() external view returns(TokenData[] memory){
        TokenData[] memory tokens = new TokenData[](balanceOf(msg.sender));
        uint256 index = 0;
        for (uint256 i = 0; i < id; i++) {
            if (ownerOf(i) == msg.sender) {
                tokens[index] = TokenData({
                    tokenId: i,
                    owner: ownerOf(i),
                    document: DATA_Document[i],
                    status: DATA_Status[i],
                    price: DATA_Price[i]
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
            if (DATA_Status[i] == _status) {
                total++;
            }
        }
        return total;
    }

    /* Get one available token to buy */
    function getAvailableToken() external view returns(TokenData memory){
        for (uint256 i = 0; i < id; i++) {
            if (DATA_Status[i] == Status.Available) {
                return TokenData({
                    tokenId: i,
                    owner: ownerOf(i),
                    document: DATA_Document[i],
                    status: DATA_Status[i],
                    price: DATA_Price[i]
                });
            }
        }
        revert ERROR___OutOfStock();
    }

    /* Get a token data by tokenId */
    function getToken(uint256 _tokenId) external view returns(TokenData memory){
        // only those listed in acces control can access
        for (uint256 i = 0; i < DATA_AccessControl[_tokenId].length; i++) {
            if (DATA_AccessControl[_tokenId][i] == msg.sender) {
                return TokenData({
                            tokenId: _tokenId,
                            owner: ownerOf(_tokenId),
                            document: DATA_Document[_tokenId],
                            status: DATA_Status[_tokenId],
                            price: DATA_Price[_tokenId]
                        });
            }
        }
        revert ERROR___AccessDenied();
    }

    /* Get a password if msg.sender included in access control list*/
    function getPassword(uint256 _tokenId) external view returns(string memory){
        // check if msg.sender included in access control list
        for (uint256 i = 0; i < DATA_AccessControl[_tokenId].length; i++) {
            if (DATA_AccessControl[_tokenId][i] == msg.sender) {
                return DATA_Password[_tokenId];
            }
        }
        revert ERROR___AccessDenied();
    }

    /* Get access control list */
    function getAccessControl(uint256 _tokenId) external view returns(address[] memory){
        // only token owner or contract owner or if sender listed on DATA_AccessControl can access
        // check if msg.sender included in access control list
        for (uint256 i = 0; i < DATA_AccessControl[_tokenId].length; i++) {
            if (DATA_AccessControl[_tokenId][i] == msg.sender) {
                return DATA_AccessControl[_tokenId];
            }
        }
        revert ERROR___AccessDenied();
    }

    // ACTION FUNCTIONS
    /* Mint a new d-meterai only by contract owner */
    function mint(uint256 _quantity, uint256 _price) external onlyOwner {
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            // Mint new token
            _safeMint(msg.sender, id);

            // Set initial data
            DATA_Price[id] = _price;
            DATA_Status[id] = Status.Available;
            DATA_Document[id] = '';
            // Update access control
            DATA_AccessControl[id].push(msg.sender);
            id++;
        }
        // Emit event
        emit DMT___Minted(tokenIds);
    }

    /* Ownership change, only can be transactioned once from minter to a first buyer */
    function buy(uint256 _tokenId) external payable {

        // Only if never Paid yet
        Status status = DATA_Status[_tokenId];
        if (status != Status.Available) revert ERROR___InvalidStatus();

        // Only if price is correct
        uint256 price = DATA_Price[_tokenId];
        if (msg.value != price) revert ERROR___InvalidPayment();
        
        // Transaction transfer
        address seller = ownerOf(_tokenId);
        _transfer(seller, msg.sender, _tokenId);
        payable(seller).transfer(msg.value);

        // Update status
        DATA_Status[_tokenId] = Status.Paid;

        // Update access control
        DATA_AccessControl[_tokenId].push(msg.sender);

        // Emit event
        emit DMT___Bought(_tokenId);
    }

    /* Bind a document to a d-meterai only by owner */
    function bind(uint256 _tokenId, string memory _document, string memory _password) external {
        // Only if status is Paid
        Status status = DATA_Status[_tokenId];
        if (status != Status.Paid) revert ERROR___InvalidStatus();

        // Only owner can bind
        if (ownerOf(_tokenId) != msg.sender) revert ERROR___AccessDenied();

        // Update binding
        DATA_Document[_tokenId] = _document;

        // Update status
        DATA_Status[_tokenId] = Status.Bound;

        // Update password
        DATA_Password[_tokenId] = _password;

        // Emit event
        emit DMT___Bound(_tokenId);
    }

    /* Add an access control to a d-meterai only by owner */
    function addAccessControl(uint256 _tokenId, address _address) external {
        // Only if status is Bound
        Status status = DATA_Status[_tokenId];
        if (status != Status.Bound) revert ERROR___InvalidStatus();

        // Only owner can add access control
        if (ownerOf(_tokenId) != msg.sender && owner() != msg.sender) revert ERROR___AccessDenied();

        // revert if already added
        for (uint256 i = 0; i < DATA_AccessControl[_tokenId].length; i++) {
            if (DATA_AccessControl[_tokenId][i] == _address) revert ERROR___ForbiddenCommand();
        }

        // Update access control
        DATA_AccessControl[_tokenId].push(_address);

        // Emit event
        emit DMT___AccessControlChanged();
    }

    /* Remove an access control from a d-meterai only by owner */
    function removeAccessControl(uint256 _tokenId, address _address) external {
        // Only if status is Bound
        Status status = DATA_Status[_tokenId];
        if (status != Status.Bound) revert ERROR___InvalidStatus();

        // Only owner can remove access control
        if (ownerOf(_tokenId) != msg.sender && owner() != msg.sender) revert ERROR___AccessDenied();

        // Owner cannot be removed from access control
        if (_address == owner() || _address == ownerOf(_tokenId)) revert ERROR___ForbiddenCommand();

        // Update access control
        for (uint256 i = 0; i < DATA_AccessControl[_tokenId].length; i++) {
            if (DATA_AccessControl[_tokenId][i] == _address) {
                DATA_AccessControl[_tokenId][i] = DATA_AccessControl[_tokenId][DATA_AccessControl[_tokenId].length - 1];
                DATA_AccessControl[_tokenId].pop();
                break;
            }
        }

        // Emit event
        emit DMT___AccessControlChanged();
    }
}