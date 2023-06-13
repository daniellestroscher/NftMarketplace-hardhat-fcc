import { ethers, network } from "hardhat"
import { moveBlocks } from "../utils/move-blocks"
import { localChains } from "../hardhat-helper-config"

async function mint() {
    const basicNft = await ethers.getContract("BasicNft")
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log(`Minted token with ID:${tokenId} at NFT Address: ${basicNft.address}`)
    console.log("---------------------------------------------------")

    if (localChains.includes(network.name)) {
        await moveBlocks(2, 1000)
    }
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
mint().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
