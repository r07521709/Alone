var ChickenStore = artifacts.require("ChickenStore");

module.exports = function(deployer) {
  deployer.deploy(ChickenStore);
};