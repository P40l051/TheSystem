import fs from 'fs'
import { NFTStorage, File } from 'nft.storage'
import { isNotJunk } from 'junk';
import chalk from "chalk";
/*
Automatic Upload of images and metadata to generate URI ready for the System smart contract
*/
const endpoint = 'https://api.nft.storage' // the default
const token = process.env.NFTSTORAGE_API_KEY;
const _baseName = "Card"

const _imageDir = "data/images"
const _jsonDir = "data/metadata"

async function main() {
    const storage = new NFTStorage({ endpoint, token })
    var [imageDirCID] = await uploadDir(_imageDir, storage);
    console.log("imageDirCID is:", imageDirCID);
    console.log("IPFS Directory link:", "https://ipfs.io/ipfs/" + imageDirCID)
    generateJsons(imageDirCID);
    var [jsonsDirCID] = await uploadDir(_jsonDir, storage);
    console.log("jsonsDirCID is:", jsonsDirCID);
    console.log("IPFS Directory link:", "https://ipfs.io/ipfs/" + jsonsDirCID)
    console.log(chalk.red("\nUri for setBaseURI function of The System smart contract:\n"), chalk.green("https://ipfs.io/ipfs/" + jsonsDirCID + "/" + _baseName + "\n"))
    const URI = "https://ipfs.io/ipfs/" + jsonsDirCID + "/" + _baseName
    return URI
}

async function uploadDir(_dir, _storage, _ext) {
    try {
        const List = fs.readdirSync(_dir).sort().filter(isNotJunk);
        const ext = "." + List[0].split(".")[1];
        List.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
        var newarray = [];
        for (let i = 0; i <= List.length - 1; i++) {
            newarray.push(new File([await fs.promises.readFile(_dir + "/" + List[i])], _baseName + (i + 1) + ext))
        }
        console.log("\n....uploading", newarray.length, "files!")
        var cid = await _storage.storeDirectory(newarray);
        return [cid, newarray.length];
    } catch (err) {
        console.log(`Error uploading files to IPFS: ${err}`);
    }
}

function generateJsons(_CID) {
    try {
        const List = fs.readdirSync(_imageDir).sort().filter(isNotJunk);
        List.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
        const ext = "." + List[0].split(".")[1];
        var json = {};
        json["name"] = [];
        json["description"] = [];
        json["image"] = [];
        json["external_url"] = [];
        for (let i = 0; i < List.length; i++) {
            var imageString = "https://ipfs.io/ipfs/" + _CID + "/" + _baseName + (i + 1) + ext;
            var externalUrlString = "https://dweb.link/ipfs/" + _CID + "/" + _baseName + (i + 1) + ext;
            json["name"] = _baseName + " #" + (i + 1);
            json["description"] = "This is an amazing card of The System";
            json["image"] = imageString;
            json["external_url"] = externalUrlString;
            var final = JSON.stringify(json);
            json["name"] = [];
            json["description"] = [];
            json["image"] = [];
            json["external_url"] = [];

            fs.writeFile(_jsonDir + "/" + _baseName + (i + 1) + ".json", final, (err) => {
                if (err)
                    throw err;
            })
        }
        console.log("Files updated!");
    } catch (err) {
        console.log(`Error reading file from disk: ${err}`);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});