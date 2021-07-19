import Web3 from "web3"
import earthimageArtifact from "../../build/contracts/EarthimageContract.json"
import fleek from "@fleekhq/fleek-storage-js"

// Create a Javascript class to keep track of all the things
// we can do with our contract.
// Credit: https://github.com/truffle-box/webpack-box/blob/master/app/src/index.js
const App = {
  web3: null,
  account: null,
  earthimageContract: null,

  start: async function () {
    // Connect to Web3 instance.
    const { web3 } = this

    try {
      // Get contract instance.
      const networkId = await web3.eth.net.getId()
      const deployedNetwork = earthimageArtifact.networks[networkId]
      this.earthimageContract = new web3.eth.Contract(
        earthimageArtifact.abi,
        deployedNetwork.address
      )

      // Get accounts and refresh the balance.
      const accounts = await web3.eth.getAccounts()
      this.account = accounts[0]
    } catch (error) {
      console.error("Could not connect to contract or chain: ", error)
    }
  },

  storeMetadata: async function (owner, location, heading, fov, pitch, image) {
    // Build the metadata.
    var metadata = {
      name: "EarthImage",
      description: `EarthImage owned by ${owner}`,
      owner: owner,
      location: location,
      heading: heading,
      fov: fov,
      pitch: pitch,
      image: image,
      timestamp: new Date().toISOString(),
    }

    // Configure the uploader.
    const uploadMetadata = {
      apiKey: process.env.FLEEK_API_KEY,
      apiSecret: process.env.FLEEK_API_SECRET,
      key: `metadata/${metadata.timestamp}.json`,
      data: JSON.stringify(metadata),
    }

    // Tell the user we're sending the shoutout.
    this.setStatus("Sending shoutout... please wait!")

    // Add the metadata to IPFS first, because our contract requires a
    // valid URL for the metadata address.
    const result = await fleek.upload(uploadMetadata)

    // Once the file is added, then we can send a shoutout!
    this.createEarthImage(owner, result.publicUrl)
  },

  createEarthImage: async function (owner, metadataURL) {
    // Fetch the createEarthImage method from our contract.
    const { createEarthImage } = this.earthimageContract.methods

    // createEarthImage the shoutout.
    await createEarthImage(owner, metadataURL).send({ from: this.account })

    // Set the status and show the metadata link on IPFS.
    this.setStatus(
      `Shoutout sent! View the metadata <a href="${metadataURL}" target="_blank" style="color: #00ff00">here</a>.`
    )
  },

  setStatus: function (message) {
    $("#status").html(message)
  },
}

window.App = App

// When all the HTML is loaded, run the code in the callback below.
$(document).ready(async function () {
  // Detect Web3 provider.
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum)
    window.ethereum.enable() // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live"
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
  }
  // Initialize Web3 connection.
  window.App.start()

  const fleekInput = {
    apiKey: process.env.FLEEK_API_KEY,
    apiSecret: process.env.FLEEK_API_SECRET,
    bucket: "xiluna-team-bucket",
    getOptions: ["publicUrl"],
  }

  const result = await fleek.listFiles(fleekInput)
  $.each(result, function (index, value) {
    $.ajax({
      type: "GET",
      url: value["publicUrl"],
      dataType: "json",
      success: function (data) {
        let owner = ""

        if (data.owner == address) {
          owner = "You are the owner of this recipe!"
        } else {
          owner = data.owner
        }

        $("#activity").append(
          `<li class="list-group-item">Location: ${data.location} | Owner: ${owner}</li>`
        )
      },
    })
  })

  // Capture the form submission event when it occurs.
  $("#earth-image-form").submit(function (e) {
    // Run the code below instead of performing the default form submission action.
    e.preventDefault()

    // Capture form data and create metadata from the submission.
    const owner = $("#owner").val()
    const location = $("#location").val()
    const heading = $("#heading").val()
    const fov = $("#fov").val()
    const pitch = $("#pitch").val()

    const requestUrl = `https://maps.googleapis.com/maps/api/streetview?size=700x400&location=${location}&heading=${heading}&fov=${fov}&pitch=${pitch}&key=${process.env.IMAGE_API_KEY}`
    console.log("hello")
    fetch(requestUrl)
      .then(function (response) {
        return response.json()
      })
      .then(function (data) {
        let image = data
        console.log(image)
        window.App.storeMetadata(owner, location, heading, fov, pitch, image)
      })
  })
})
