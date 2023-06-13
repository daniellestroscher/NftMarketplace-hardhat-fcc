import { ethers, network } from "hardhat"
import { localChains } from "../hardhat-helper-config"
import { moveBlocks } from "../utils/move-blocks"

const TOKEN_ID = 0

async function cancel() {
    console.log("Canceling Item...")
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    const tx = await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
    await tx.wait(1)
    console.log(`NFT with tokenId ${TOKEN_ID} canceled`)
    if (localChains.includes(network.name)) {
        await moveBlocks(2, 1000)
    }
    console.log("---------------------------------------------------")
}

cancel().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
