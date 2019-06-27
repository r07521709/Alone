const EthCrypto = require('eth-crypto');

App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
      // User denied account access...
      console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return await App.initContract();
  },

  initContract:async function() {
    $.getJSON('ChickenStore.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var ChickenStoreArtifact = data;
      App.contracts.ChickenStore = TruffleContract(ChickenStoreArtifact);
      // Set the provider for our contract
      App.contracts.ChickenStore.setProvider(App.web3Provider);
    });
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#btn-message-send', App.sendMessage);
    $(document).on('click', '#btn-message-receive', App.receiveMessage);
  },

  sendMessage: function(){
    var address=$("#communicate-address").val();
    var publickey=$("#communicate-publickey").val();
    var message=$("#send-message").val();
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      EthCrypto.encryptWithPublicKey(publickey, message).then(function(encrypted){
        var encryptedString = EthCrypto.cipher.stringify(encrypted);
        var account = accounts[0];
        App.contracts.ChickenStore.deployed().then(function(instance) {
          chickenStore = instance;
          return chickenStore.sendMessage(address, encryptedString);
        }).then(function(result) {
          console.log(result);
          return (result);
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    });
  },

  receiveMessage: function(){
    var chickenStore;
    var msg='';
    var submsg;
    var privatekey=$("#communicate-privatekey").val(); 
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.ChickenStore.deployed().then(function(instance) {
        chickenStore = instance;
        var message = chickenStore.messageEvent({to: account}, {fromBlock: 0, toBlock: 'latest'});
        message.watch(function(error, result){
          if (error) {
            console.log(error)
          }
          if(privatekey!=""){
            EthCrypto.decryptWithPrivateKey(privatekey, result.args.message).then(function(decryptedString){
              submsg =  '\n' + result.args.from + ':&nbsp&nbsp' + decryptedString;
              msg = msg + submsg;
              $("#receive-message").html(msg);
            });
          }
          else{
            submsg =  '\n' + result.args.from + ':&nbsp&nbsp' + result.args.message;
            msg = msg + submsg;
            $("#receive-message").html(msg);
          }
          message.stopWatching();
        });
      }).then(function(result) {
        return (result);
      }).catch(function(err) {
        console.log(err.message);
      });
    }); 
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
