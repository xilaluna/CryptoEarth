const EarthImageContract = artifacts.require("EarthImageContract")

module.exports = function (deployer) {
  deployer.deploy(EarthImageContract)
}
