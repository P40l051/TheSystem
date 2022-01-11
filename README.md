# The System
This project is The System!

<p align="center">
  <a href="#how-to-install">How To Install</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#license">License</a>
</p>

## How To Install

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/P40l051/TheSystem.git

# Go into the repository
$ cd TheSystem

# Install dependencies
$ npm install

```

## How To Use
* Create a file .env in the main directory simlar to .env.example with your environment variables.

* To get RPC urls, if you dont run your own node, go to <a href="https://www.alchemy.com/" target="_blank">Alchemy</a> or <a href="https://infura.io/" target="_blank">Infura</a>.

* To upload images to IPFS you need NFTSTORAGE_API_KEY from <a href="https://nft.storage/" target="_blank">NFT STORAGE</a>

Try running some of the following tasks:
```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
npx hardhat coverage
```
Try this scripts:
```shell
npx hardhat run scripts/deploy.js
npx hardhat run scripts/interact.js
npx hardhat run scripts/interact.js --network rinkeby
npx hardhat run scripts/uploadIPFS.mjs
```
## License

MIT

---