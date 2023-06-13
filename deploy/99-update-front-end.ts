import { ethers, network } from "hardhat"
import { ethers as eth } from "ethers"
import fs from "fs"

const frontEndContractsFile = "../nextjs-nft-marketplace-fcc/src/constants/networkMapping.json"
const frontEndAbiLocation = "../nextjs-nft-marketplace-fcc/src/constants/"

async function UpdateFrontend() {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end contract addresses...")
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateContractAddresses() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId as number

    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
            contractAddresses[chainId]["NftMarketplace"].push(nftMarketplace.address)
        }
    } else {
        contractAddresses[chainId] = { NftMarketplace: [nftMarketplace.address] }
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
    console.log("---------------------------------------------------")
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    fs.writeFileSync(
        `${frontEndAbiLocation}NftMarketplace.json`,
        //@ts-ignore
        nftMarketplace.interface.format(eth.utils.FormatTypes.json)
    )
    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        //@ts-ignore
        basicNft.interface.format(eth.utils.FormatTypes.json)
    )
}

export default UpdateFrontend
UpdateFrontend.tags = ["all", "frontend"]
