import { moveBlocks } from "../utils/move-blocks"

const BLOCKS = 5

async function mine() {
    await moveBlocks(BLOCKS)

    console.log(`${BLOCKS} blocks mined!`)
    console.log("---------------------------------------------------")
}

mine().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
