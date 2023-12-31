import { ethers, network } from "hardhat"
import { moveBlocks } from "../utils/move-blocks"
import { localChains } from "../hardhat-helper-config"

const PRICE = ethers.utils.parseEther("0.1")

async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log("Approving Nft...")
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)
    console.log("Listing Nft...")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("Listed!")
    console.log("---------------------------------------------------")

    if (localChains.includes(network.name)) {
        console.log("moving blocks...")
        await moveBlocks(2, 1000)
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
mintAndList().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
