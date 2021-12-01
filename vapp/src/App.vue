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
      <h2>All my NFT</h2>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>

<script>
import { mapGetters } from "vuex";
import Web3 from "web3";
import Blob from "./contracts/Blob.json";

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
    };
  },
  computed: mapGetters("drizzle", ["isDrizzleInitialized"]),
  mounted: function () {
    this.loadWeb3();
    this.loadBlockchainData();
  },
  methods: {
    loadWeb3: async function () {
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
    loadBlockchainData: async function () {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      const networkId = await web3.eth.net.getId();
      const networkData = Blob.networks[networkId];

      if (networkData) {
        const abi = Blob.abi;
        const address = networkData.address;

        this.contract = new web3.eth.Contract(abi, address);
        this.totalSupply = await this.contract.methods.totalSupply().call();

        this.blobs = await this.contract.methods
          .userOwnedTokens(this.account)
          .call();
        console.log(this.blobs);
      } else {
        window.alert("Smart contract not deployed to detected network.");
      }
    },
    mint: function () {
      this.contract.methods
        .mint(this.account)
        .send({ from: this.account })
        .once("receipt", (receipt) => {
          console.log(receipt);
        });
    },
    randomColor: function () {
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
    getSVG: function () {},
    convertToBase64: function () {},
    uploadIPFS: function () {},
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
}
</style>
