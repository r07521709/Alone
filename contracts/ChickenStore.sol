//Version8_20190531
pragma solidity ^0.5.0;

contract ChickenStore {
    
    uint public numberOfSeller = 0; 
    mapping(address => chicken) store;
    mapping(uint => address) account;
    mapping(address => information) accountInformation;
    event messageEvent(address indexed from, address indexed to, string message);

    struct chicken {
        address seller;
        string name;
        string imageLink;
        string service;
        uint price;
        uint travelFare;
    }
    
    struct information {
        bool registered;
        bool tradable;
        bool inTransaction;
        address buyer;
        string sellerPublicKey;
        string buyerPublicKey;
        bool sellerSuccess;
        bool buyerSuccess;
        uint[] evaluation;
    }
    
    modifier participants(address addr) {
        require(accountInformation[msg.sender].buyer == addr || msg.sender == accountInformation[addr].buyer);
        _;
    }
    
    function paymentInitialize(address addr) internal {
        accountInformation[addr].inTransaction = false;
        accountInformation[addr].buyer = address(0);
        accountInformation[addr].buyerPublicKey = "";
        accountInformation[addr].sellerSuccess = false;
        accountInformation[addr].buyerSuccess = false;
    }
    
    function launch(string memory _name, string memory _imageLink, string memory _service, uint _price, uint _travelFare, string memory _publicKey) public {
        require(accountInformation[msg.sender].inTransaction == false);
        require(_price > _travelFare);
        require(bytes(_publicKey).length == 128);
        paymentInitialize(msg.sender);
		if(accountInformation[msg.sender].registered == false ) {
		    numberOfSeller++;
		    account[numberOfSeller] = msg.sender;
		    accountInformation[msg.sender].registered = true;
		}
		accountInformation[msg.sender].sellerPublicKey = _publicKey;
		chicken memory _newChicken = chicken(msg.sender, _name, _imageLink, _service, _price, _travelFare);
		store[msg.sender] = _newChicken;
		accountInformation[msg.sender].tradable = true;
	}
	
	function getChickenInformation(uint num) public view returns (bool, address, string memory, string memory, string memory, uint, uint, string memory) {
        address addr = account[num];
        bool _tradable = accountInformation[addr].tradable;
        chicken memory _chicken = store[addr];
        return (_tradable, _chicken.seller, _chicken.name, _chicken.imageLink, _chicken.service, _chicken.price, _chicken.travelFare, accountInformation[addr].sellerPublicKey);
    }
    
    function buyChicken(address payable addr, string memory _publicKey) public payable {
        require(msg.sender != addr && msg.value >= store[addr].price*(10**18));
        require(accountInformation[addr].tradable == true);
        require(bytes(_publicKey).length == 128);
        accountInformation[addr].buyer = msg.sender;
        accountInformation[addr].tradable = false;
        accountInformation[addr].inTransaction = true;
        accountInformation[addr].buyerPublicKey = _publicKey;
    }
   
    function getRequest() public view returns (address, string memory) {
        require(accountInformation[msg.sender].registered == true);
        require(accountInformation[msg.sender].buyer != address(0));
        return (accountInformation[msg.sender].buyer, accountInformation[msg.sender].buyerPublicKey);
    }
    
    function sendMessage(address addr, string memory message) public participants(addr) {
        emit messageEvent(msg.sender, addr, message);
    }
    
    function transactionSuccess(address payable addr) public participants(addr) {
        require(accountInformation[msg.sender].inTransaction == true || accountInformation[addr].inTransaction == true);
        if(accountInformation[msg.sender].buyer == addr) {
            accountInformation[msg.sender].sellerSuccess = true;
            if(accountInformation[msg.sender].buyerSuccess == true) {
                msg.sender.transfer(store[msg.sender].price*(10**18));
                accountInformation[msg.sender].inTransaction =false;
            }
        }
        if(msg.sender == accountInformation[addr].buyer) {
            accountInformation[addr].buyerSuccess = true;
            if(accountInformation[addr].sellerSuccess == true) {
                addr.transfer(store[addr].price*(10**18));
                accountInformation[addr].inTransaction = false;
            }
        }
    }
    
    function transactionFail(address payable addr) public participants(addr) {
        if(accountInformation[msg.sender].buyer == addr) {
            addr.transfer(store[msg.sender].price*(10**18));
            paymentInitialize(msg.sender);
        }
        if(msg.sender == accountInformation[addr].buyer) {
            msg.sender.transfer((store[addr].price-store[addr].travelFare)*(10**18));
            addr.transfer(store[addr].travelFare*(10**18));
            paymentInitialize(addr);
        }
    }
    
    function evaluate(address addr, uint evaluation) public {
        require(msg.sender == accountInformation[addr].buyer);
        require(evaluation>=1 && evaluation<=5);
        require(accountInformation[addr].sellerSuccess == true && accountInformation[addr].buyerSuccess == true, "Complete your transaction, please.");
        accountInformation[addr].evaluation.push(evaluation);
        paymentInitialize(addr);
    }
    
    function showEvaluation(address addr) public view returns (uint[] memory){
        return accountInformation[addr].evaluation;
    }
    
}