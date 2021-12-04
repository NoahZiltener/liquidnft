<template>
  <div v-if="isDrizzleInitialized" id="app">
    <div class="section">
      <h2>Account:</h2>
      <p>{{ account }}</p>
    </div>
    <div class="section">
      <h2>Mint NFT</h2>
      <button type="button" v-on:click="mint">Click Me!</button>
    </div>
    <div class="section">
      <h2>All NFTs</h2>
    </div>
    <div class="container">
      <img
        v-for="blob in blobs"
        :key="blob.id"
        :alt="blob.metaData.name"
        :src="blob.metaData.image"
        width="250"
        height="250"
        class="img"
      />
    </div>
  </div>
  <div v-else>Loading...</div>
</template>

<script>
import { mapGetters } from "vuex";
import Web3 from "web3";
import Blob from "./contracts/Blob.json";
import blobshape from "blobshape";
import { create } from "ipfs-http-client";

const ipfsClient = create("https://ipfs.infura.io:5001/api/v0");

export default {
  name: "app",
  components: {},
  data() {
    return {
      blobs: [],
      loaded: false,
      web3: null,
      account: "",
      contract: null,
      totalSupply: 0,
      ipfsBaseUrl: "https://ipfs.infura.io/ipfs/",
      name: "Blob",
      description: "Blob",
    };
  },
  computed: mapGetters("drizzle", ["isDrizzleInitialized"]),
  mounted: function() {
    this.loadWeb3();
    this.loadBlockchainData();
  },
  methods: {
    loadWeb3: async function() {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        window.alert(
          "Non-Ethereum browser detected. You should consider trying MetaMask!"
        );
      }
    },
    loadBlockchainData: async function() {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      const networkId = await web3.eth.net.getId();
      const networkData = Blob.networks[networkId];

      if (networkData) {
        const abi = Blob.abi;
        const address = networkData.address;
        this.contract = new web3.eth.Contract(abi, address);
        this.fetchData();
      } else {
        window.alert("Smart contract not deployed to detected network.");
      }
    },
    mint: async function() {
      const { path, seedValue } = blobshape({
        growth: 1,
        edges: 11,
        seed: null,
        pattern: "cross",
      });
      let color1 = this.randomColor2();
      let color2 = this.randomColor2();

      let svg = this.getSVG(color1, color2, path);
      let base64 = this.convertToBase64(svg);

      let addedMetaData = await this.uploadIPFS(base64);

      this.contract.methods
        .mint(this.account, this.ipfsBaseUrl + addedMetaData.path)
        .send({ from: this.account })
        .once("error", () => {
          console.log(err);
        })
        .then(() => {
          this.fetchData();
        });
    },
    randomColor: function() {
      var o = Math.round,
        r = Math.random,
        s = 255;
      return (
        "rgba(" +
        o(r() * s) +
        "," +
        o(r() * s) +
        "," +
        o(r() * s) +
        "," +
        r().toFixed(1) +
        ")"
      );
    },
    randomColor2: function() {
      var randomColor = Math.floor(Math.random() * 16777215).toString(16);
      return "#" + randomColor;
    },
    getSVG: function(color1, color2, path) {
      let svg = `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%">
        <rect width="100%" height="100%" fill="${color1}" rx="15" ry="15"/>
        <path id="blob"
          filter="url(#shadow)" d="${path}" fill="none" stroke-width="15px" stroke="${color2}"></path>
        <filter id='shadow' height="180%" width="180%" color-interpolation-filters="sRGB">
        <feDropShadow dx="20" dy="20" stdDeviation="8" flood-opacity="0.3" />
        </filter>
    </svg>
      `;
      return svg;
    },
    convertToBase64: function(svg) {
      return "data:image/svg+xml;base64," + btoa(svg);
    },
    uploadIPFS: async function(base64) {
      try {
        const metaDataObj = {
          name: this.name,
          description: this.description,
          image: base64,
        };
        const addedMetaData = await ipfsClient.add(JSON.stringify(metaDataObj));
        return addedMetaData;
      } catch (err) {
        console.log(err);
      }
    },
    fetchData: async function() {
      this.blobs = [];
      let nfts = await this.contract.methods.getAllTokens().call();
      nfts.forEach((nft) => {
        fetch(nft.uri)
          .then((response) => response.json())
          .then((metaData) => {
            this.blobs = [...this.blobs, { id: nft.id, metaData: metaData }];
          })
          .catch((err) => {
            console.log(err);
          });
      });
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  align-content: center;
}

.container {
  display: flex; /* or inline-flex */
  flex-wrap: wrap;
  justify-content: center;
}

.img {
  padding: 5px;
}
</style>
