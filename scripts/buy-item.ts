import { ethers, network, getNamedAccounts } from "hardhat"
import { localChains } from "../hardhat-helper-config"
import { moveBlocks } from "../utils/move-blocks"

const TOKEN_ID = 0

async function buyItem() {
    console.log("Buying Item...")
    const player = (await getNamedAccounts()).player
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    const tx = await nftMarketplace.connect(player).buyItem(basicNft.address, TOKEN_ID)
    await tx.wait(1)
    console.log(`NFT with tokenId ${TOKEN_ID} was bought by ${player}`)
    if (localChains.includes(network.name)) {
        await moveBlocks(2, 1000)
    }
    console.log("---------------------------------------------------")
}

buyItem().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
