/*
This is a script for real networks:
1) If you run on development networks you can re-deploy your contracts every time.
2) On real networks (after first deploy) you have to attach your script to previously deployed contracts
-> contract address is in helper-hardhat-config.js 
 - real TheSystem contract deployed on rinkeby test network - 
RUN:
npx hardhat run scripts/interact.js --network rinkeby
*/

const hre = require("hardhat");
const chalk = require("chalk");

const { developmentChains, networkConfig, getNetworkIdFromName } = require('../helper-hardhat-config')

async function main() {
    const networkName = hre.network.name;
    console.log("networkName:", networkName);
    chainId = await getNetworkIdFromName(networkName);

    if (developmentChains.includes(networkName)) {
        console.log("Local network detected! Deploying...");
        exampleContractAddress = networkConfig[chainId]['exampleContract'];
        console.log("exampleContractAddress per questo network:", exampleContractAddress);
    }
    else if (networkName == "ganache") {
        console.log("GANACHE: Persistent local network! attach to existent contracts...");
        const TheSystem = await ethers.getContractFactory("TheSystem");
        ContractAddress = networkConfig[chainId]['TheSystem'];
        const theSystem = await TheSystem.attach(ContractAddress);
        console.log(chalk.red("TheSystem contract owner is:", await theSystem.owner()));
    }
    else if (networkName == "rinkeby") {
        console.log("RINKEBY: real network! attach to existent contracts...");
        [owner, addr1, addr2, _] = await ethers.getSigners();
        console.log("owner:", owner.address);
        console.log("addr1:", addr1.address);
        console.log("addr2:", addr2.address);
        const TheSystem = await ethers.getContractFactory("TheSystem");
        ContractAddress = networkConfig[chainId]['TheSystem'];
        const theSystem = await TheSystem.attach(ContractAddress);
        console.log(chalk.red("TheSystem contract address is:", await theSystem.address));
        console.log(chalk.red("TheSystem contract owner is:", await theSystem.owner()));

        console.log("id1 is active:", await theSystem.isActiveID(1));
        console.log("id2 is active:", await theSystem.isActiveID(2));
        console.log("id3 is active:", await theSystem.isActiveID(3));

        console.log("balace of owner id1:", await theSystem.balanceOf(owner.address, 1))
        console.log("balace of owner id2:", await theSystem.balanceOf(owner.address, 2))
        console.log("balace of owner id3:", await theSystem.balanceOf(owner.address, 3))

        console.log("uri 1:", await theSystem.uri(1));
        console.log("uri 2:", await theSystem.uri(2));
        console.log("uri 3:", await theSystem.uri(3));
        //await theSystem.changeMint();
        //await theSystem.setBaseURI("https://ipfs.io/ipfs/bafybeihito7mzshh36mloxidpnpxck5xdauuuvzt4vahmzq5xtlbz3oofy/fakePunk");
        // await theSystem.setMaxSupply(100);
        // await theSystem.activateBatch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
        //await theSystem.burnBatch(owner.address, [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [])
        // await theSystem.connect(addr1).burnBatch(addr1.address, [2, 3], [9, 9], []) //aadr1 no gas
        // const tx3 = await theSystem.activateBatch([5, 6]);
        // const receipt3 = await tx3.wait()
        // await theSystem.mintBatch(addr1.address, [5, 6], [1, 1], [])
        //const tx1 = await theSystem.mint(owner.address, 1, 1, [])
        //const recipt1 = tx1.wait()
        //const tx2 = await theSystem.burn(owner.address, 1, 1, [])
        //const recipt2 = tx2.wait()
        //await theSystem.burnBatch(owner.address, [1, 2], [1, 1], [])
        //await theSystem.connect(addr1).burnBatch(addr1.address, [2, 7], [1, 1], [])
        //console.log("mint active:", await theSystem.mintActive());
        console.log("balace of addr1 id1:", await theSystem.balanceOf(addr1.address, 1))
        console.log("balace of addr1 id2:", await theSystem.balanceOf(addr1.address, 2))
        console.log("balace of addr1 id3:", await theSystem.balanceOf(addr1.address, 3))
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
