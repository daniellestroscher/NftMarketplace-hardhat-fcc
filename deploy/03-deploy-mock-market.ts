import { ethers, network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { localChains } from "../hardhat-helper-config"

const DeployMockNftMarket: DeployFunction = async ({
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    //const chainId = network.config.chainId as number

    const nftMarket = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")

    if (localChains.includes(network.name)) {
        log("Local Network Detected...")
        await deploy("MockNftMarket", {
            from: deployer,
            args: [nftMarket.address, basicNft.address],
            log: true,
            waitConfirmations: 1,
        })
        log("Mock Marketplace Deployed!")
        log("--------------------------------------------------------")
    }
}
export default DeployMockNftMarket
DeployMockNftMarket.tags = ["all"]
