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
    return App.initContract();
  },

  initContract: function() {
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
    App.GetRequest();
    $(document).on('click', '#btn-account-reject', App.AccountReject);
    $(document).on('click', '#btn-account-confirm', App.AccountConfirm);
    $(document).on('click', '#btn-account-evaluate', App.AccountEvaluate);
    $(document).on('click', '#btn-account-lookup', App.AccountLookUp);
  },

  GetRequest:function(){
    var chickenStore;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.ChickenStore.deployed().then(function(instance) {
        chickenStore = instance;
        return chickenStore.getRequest();
      }).then(function(result) {
        $("#account-buyer").text(result[0]);
        $("#account-buyer-publickey").text(result[1]);
        return (result);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  AccountReject: function(event) {
    event.preventDefault();
    var address=$("#confirm-address").val();
    var chickenStore;
    App.contracts.ChickenStore.deployed().then(function(instance) {
      chikenStore = instance;
      return chikenStore.transactionFail(address);
    }).then(function(result) {
      console.log(result);
      return (result);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  AccountConfirm: function(event) {
    event.preventDefault();
    var address=$("#confirm-address").val();
    var chickenStore;
    App.contracts.ChickenStore.deployed().then(function(instance) {
      chikenStore = instance;
      return chikenStore.transactionSuccess(address);
    }).then(function(result) {
      console.log(result);
      return (result);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  AccountEvaluate:function(){
    event.preventDefault();
    var address=$("#evaluate-address").val();
    var star=$("#evaluate-star").val();
    var chickenStore;
    App.contracts.ChickenStore.deployed().then(function(instance) {
      chikenStore = instance;
      return chikenStore.evaluate(address,star);
    }).then(function(result) {
      console.log(result);
      return (result);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  AccountLookUp:function(){
    event.preventDefault();
    var address=$("#show-evaluate-address").val();
    var chickenStore;
    var evaluation;
    var sum = 0;
    App.contracts.ChickenStore.deployed().then(function(instance) {
      chikenStore = instance;
      return chikenStore.showEvaluation(address);
    }).then(function(result) {
      if(result.length>0){
        for(i=0;i<result.length;i++) {
          sum += parseInt(result[i],10);
        }
        evaluation = "Star: " + (sum/result.length).toFixed(1);
        $("#showEvaluation-star").text(evaluation);
      }  
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
