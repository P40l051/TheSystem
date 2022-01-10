require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    ganache: {
      url: 'HTTP://127.0.0.1:7545',
      accounts: {
        mnemonic: process.env.GANACHE_MNEMONIC,
      }
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL || "",
      accounts: {
        mnemonic: process.env.TESTNET_MNEMONIC || "",
      },
      saveDeployments: true,
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts: {
        mnemonic: process.env.TESTNET_MNEMONIC || "",
      }
      // process.env.TEST_PRIVATE_KEY !== undefined ? [process.env.TEST_PRIVATE_KEY] : [],
    },

  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS_ETH) ? false : false,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
