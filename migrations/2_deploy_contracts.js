const EarthimageContract = artifacts.require("EarthimageContract")

module.exports = function (deployer) {
  deployer.deploy(EarthimageContract)
}
