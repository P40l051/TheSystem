const networkConfig = {
    undefined: {
        name: 'localhost',
        exampleContract: '0x0000 TEST localhost'
    },
    31337: {
        name: 'hardhat',
        exampleContract: '0x0000 TEST hardhat'
    },
    5777: {
        name: 'ganache',
        exampleContract: '0x0000 TEST ganache',
        TheSystem: "0x724c9e7Ed8b0CbBBFCD28541bf30ff6F7a84635C" //update this after first deploy on ganache network
    },
    42: {
        name: 'kovan',
        exampleContract: '0xa36085F69e2889c224210F603D836748e7dC0088',
    },
    4: {
        name: 'rinkeby',
        exampleContract: '0x01be23585060835e02b77ef475b0cc51aa1e0709',
        TheSystem: "0x31eda4066B6E258bf56e17A93f17D96DAcDA8cD8" //update this after first deploy on rinkeby network
    },
    1: {
        name: 'mainnet',
    },
    5: {
        name: 'goerli',
    },
    80001: {
        name: 'mumbai',
    },
    137: {
        name: 'polygon',
        exampleContract: '0xb0897686c545045afc77cf20ec7a532e3120e0f1',
    }
}

const developmentChains = ["hardhat", "localhost"]

const getNetworkIdFromName = async (networkIdName) => {
    for (const id in networkConfig) {
        if (networkConfig[id]['name'] == networkIdName) {
            return id
        }
    }
    return null
}

module.exports = {
    networkConfig,
    getNetworkIdFromName,
    developmentChains
}

