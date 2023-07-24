require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/PdxIi51_Sbs1oR7mWqVuUyc-XnlXt9KI",
      accounts: [
        "a588ea1745b39e6b217c1a63ed0868dbcd77342b27e017b4b77c4f26467d317a",
      ],
    },
  },
};
